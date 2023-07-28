require 'ams_client'

module Api
  module V1
    class TisoReservationsController < Api::ApiController

      MANY_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "attributes": {
            "type": "object",
            "properties": {
              "container_ids": {
                "type": "array",
                "items": [
                  {
                    "type": "string"
                  }
                ]
              }
            },
            "required": [
              "container_ids"
            ]
          }
        },
        "required": [
          "attributes"
        ]
      }

      def occupants
        scope = Pundit.policy_scope!(pundit_user, TisoReservation)
        reservations =
            scope.includes(container: :container_type,
                                    run: { project: :organization }).map do |r|

            {
                id:               r.id,
                container_id:     r.container_id,
                device_id:        r.device_id,
                slot:             r.slot,
                run_execution_id: r.run_execution_id,
                run_id:           r.run_id,
                instruction_id:   r.instruction_id,
                org_subdomain:    r.run.project.organization.subdomain,
                project_id:       r.run.project.id,
                container_type:   r.container.container_type.name,
                updated_at:       r.updated_at
            }
            end

        render json: { reservations: reservations }
      end

      def retrieve
        container = Container.find(params[:container_id])
        authorize(container, :manage_tisos_container?)
        unless container.location
          return render json: {
            errors: 'Cannot retrieve plate no longer in tiso'
          }, status: :bad_request
        end

        storage_condition = container.storage_condition || 'ambient'
        destinies = {
          container.id => { store: { where: storage_condition, shaking: false }}
        }

        submit_tiso_run([ container ], destinies, 'retrieve')
      end

      def retrieve_many
        validate_json(MANY_SCHEMA, params[:data].to_unsafe_hash)
        container_ids = params[:data][:attributes][:container_ids]
        containers = []
        destinies = {}
        container_ids.each do |container_id|
          con = Container.find(container_id)
          authorize(con, :manage_tisos_container?)

          if !con.location
            return render json: { errors: 'Cannot retrieve plate no longer in tiso' }, status: :bad_request
          end
          containers.push(con)
          storage_condition = con.storage_condition || 'ambient'
          destinies[con.id] = { store: { where: storage_condition, shaking: false }}
        end
        submit_tiso_run(containers, destinies, 'retrieve')
      end

      def manual_remove_many
        validate_json(MANY_SCHEMA, params[:data].to_unsafe_hash)
        container_ids = params[:data][:attributes][:container_ids]

        ActiveRecord::Base.transaction do
          container_ids.each do |container_id|

            container = Container.find_by_id(container_id)
            if !container
              next
            end
            authorize(container, :manage_tisos_container?)


            remove(container)

            unless container.errors.empty?
              return render json: container.errors, status: :unprocessable_entity
            end
          end
        end
        head :no_content
      end



      def discard_many
        validate_json(MANY_SCHEMA, params[:data].to_unsafe_hash)
        container_ids = params[:data][:attributes][:container_ids]

        containers = []
        destinies = {}

        container_ids.each do |container_id|
          con = Container.find(container_id)
          authorize(con, :manage_tisos_container?)
          containers.push(con)
          destinies[con.id] = { discard: true }
        end

        submit_tiso_run(containers, destinies, 'discard')
      end


      def manual_remove
        container = Container.find_by_id(params.require(:id))

        if !container
          return head :no_content
        end

        authorize(container, :manage_tisos_container?)
        remove(container)

        if container.errors.empty?
          head :no_content
        else
          render json: container.errors, status: :unprocessable_entity
        end
      end

      def discard
        c = Container.find(params[:container_id])
        authorize(c, :manage_tisos_container?)
        containers = []
        destinies = {}

        containers.push(c);
        destinies[containers[0].id] = { discard: true }

        submit_tiso_run(containers, destinies, 'discard')
      end


    private

      def remove(container)

        container.device_id = "outside"

        if LocationService.in_tisos?(container)
          # If container is in tiso, remove all locations so operator can assign new location
          container.slot      = nil
          container.location  = nil
        end

        container.save
      end

      # trick for being able to mock it...
      def create_mcx_client
        McxClient.new
      end

      def submit_tiso_run(containers, destinies, title)
        begin
          workcell_id = containers[0].workcell
        rescue ContainerError => e
          return render json: { error_message: e.message }, status: :bad_request
        end

        payload = TisoReservation.run_payload(containers, destinies, title)

        # check if workcell is handle by RoR
        if Workcell.exists?(workcell_id: workcell_id)
          tcle_service = find_tcle_service(workcell_id)
          res = tcle_service.queue_run(workcell_id, payload)
        else
          # query AMS -- FIXME: server side filtering?
          service = ASSET_MANAGEMENT_SERVICE.submittable_services(current_user, @organization, nil).find do |service|
            service.node_id == workcell_id
          end

          if service.nil?
            error = { error_message: "Can not submit run to service for workcell #{workcell_id}" }
            return render json: { error_message: error }, status: :bad_request
          end

          if service.state == AMSClient::ServiceState::NOT_DEPLOYED
            error = { error_message: "Service for workell #{workcell_id} is not deployed" }
            return render json: { error_message: error }, status: :precondition_failed
          end

          res = create_mcx_client.submit_run(service.url, workcell_id, payload)
          res = JSON.parse(res, symbolize_names: true)
        end

        if res.nil? or !res[:success]
          error = res&.[](:message) || "Nothing was returned by SCLE"
          render json: { error_message: error } , status: :internal_server_error
        else
          head :no_content
        end
      end
    end
  end
end
