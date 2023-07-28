require 'auto_provision_strategy'
module Api
  module V1
    class ProvisionSpecsController < Api::ApiController
      def index_for_resource
        resource_id = params.require(:resource_id)
        provision_specs = ProvisionSpec.all_by_resource(resource_id)

        render json: provision_specs
      end

      def index
        run_id = params.require(:run_id)
        scope = Pundit.policy_scope!(pundit_user, ProvisionSpec)
        authorize(ProvisionSpec.new, :index?)
        specs = scope.joins(instruction: :run)
                     .where(instructions: { run_id: run_id })

        render json: specs
      end

      def create
        instruction = Instruction.find_by!(run_id: params.require(:run_id),
                                           id: params.require(:instruction_id))
        authorize(instruction.run, :instruction?)

        if instruction.completed?
          return render json: {
            errors: [ 'Cannot create a provision spec for a completed instruction' ]
          }, status: :bad_request
        end

        unless instruction.op == 'provision' || instruction.op == 'dispense'
          error_str = "Must use provision or dispense instruction: #{instruction.op}"
          return render json: { errors: [ error_str ] }, status: :bad_request
        end

        # convert the parameters into `valid` liquid transfers
        # TODO: allow ProvisionSpec model to handle human well_indexes as well.
        #       This would allow us to remove this transformation step and completely
        #       contain validations to within the model.
        transfers = params.require(:transfers).map do |lt|
          from_container = Container.find lt.require(:from)
          to_refname     = lt.require(:to)
          to_ref         = instruction.run.refs.find { |ref| ref.name == to_refname }

          if to_ref.nil?
            return render json: { errors: [ "missing ref #{to_refname}" ] }, status: :bad_request
          end

          from_ctype = from_container.container_type
          to_ctype   = to_ref.container_type

          transfer = {
            from:          lt.require(:from),
            to:            lt.require(:to),
            from_well_idx: from_ctype.robot_well(lt.require(:from_well_idx)),
            to_well_idx:   to_ctype.robot_well(lt.require(:to_well_idx)),
          }
          mode = instruction.parsed.measurement_mode
          if mode == 'mass'
            transfer['mass'] = lt.require(:mass).to_f
          else
            transfer['volume'] = lt.require(:volume).to_f
          end
          transfer
        end

        provision_spec = ProvisionSpec.new(instruction_id: instruction.id,
                                           resource_id: instruction.operation["resource_id"],
                                           transfers: transfers)

        success, errors = provision_spec.validate
        if not success
          return render json: { errors: errors }, status: :bad_request
        end

        ProvisionSpec.where(instruction_id: instruction.id).map(&:destroy)
        provision_spec.save

        render json: provision_spec, status: :created
      rescue => e
        render json: { errors: [ e.message ] }, status: :unprocessable_entity
      end

      def auto_create
        instruction = Instruction.find_by!(run_id: params.require(:run_id),
                                           id: params.require(:instruction_id))
        authorize(instruction.run, :instruction?)

        if instruction.completed?
          return render json: {
            errors: [ 'Cannot create a provision spec for a completed instruction' ]
          }, status: :bad_request
        end

        mode = params.require(:mode)

        unless instruction.op == 'provision' || instruction.op == 'dispense'
          error_str = "Must use provision or dispense instruction: #{instruction.op}"
          return render json: { errors: [ error_str ] }, status: :bad_request
        end

        transfers = ProvisionStrategies.provision(instruction, mode)

        if transfers && !transfers.empty?
          provision_spec = ProvisionSpec.new(instruction_id: instruction.id,
                                             resource_id: instruction.operation["resource_id"],
                                             transfers: transfers)

          success, errors = provision_spec.validate(true)
          if not success
            return render json: { errors: errors }, status: :bad_request
          end

          ProvisionSpec.where(instruction_id: instruction.id).map(&:destroy)
          provision_spec.save

          render json: provision_spec, status: :created
        elsif transfers && transfers.empty?
          render json: { errors: [ "Exact match not found, please check Manual section" ], show_manual: true },
status: :bad_request
        else
          render json: { errors: [ "Insufficient reagent in stock" ] }, status: :bad_request
        end
      rescue => e
        render json: { errors: [ e.message ] }, status: :unprocessable_entity
      end

    end
  end
end
