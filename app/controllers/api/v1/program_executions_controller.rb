module Api
  module V1
    class ProgramExecutionsController < Api::ApiController
      def create
        run_id = params.require(:run_id)
        program_id = params[:program_id]
        user_id = current_user.id
        execution_context = params[:context] || 'all'
        run = Run.find(run_id)
        authorize(run, :show?)

        response = if program_id.present?
                     execute(program_id, run, user_id)
                   else
                     execute_from_context(execution_context, run)
                   end

        render json: response, status: :created
      end

      private

      def execute_from_context(execution_context, run)
        authorize(run, :execute_programs?)

        # get protocol from run
        protocol = Protocol.find_by_id(run.protocol_id)
        if protocol.nil?
          run.errors.add(:protocol, :blank)
          raise ActiveRecord::RecordInvalid.new(run)
        end

        # get post run and post instruction programs from protocol
        program_id = protocol.program_id
        per_inst_program_id = protocol.per_inst_program_id
        if program_id.nil? && per_inst_program_id.nil?
          protocol.errors.add(:program_id, :blank)
          raise ActiveRecord::RecordInvalid.new(protocol)
        end

        resources = []

        ActiveRecord::Base.transaction do
          executions = []
          if program_id.present? && execute_run_program?(execution_context)
            executions << create_post_run_program_executions(program_id, run)
          end
          if per_inst_program_id.present? && execute_instruction_program?(execution_context)
            executions += create_post_instruction_program_executions(per_inst_program_id, run)
          end

          # execute programs created
          executions.each do |execution|
            ExecuteProgramJob.new.perform(execution.id)
            execution.reload
            resources << Api::V1::ProgramExecutionResource.new(execution, context)
          end
        end

        Api::V1::ProgramExecutionResource.serializer.serialize_to_hash(resources)
      end

      def execute_instruction_program?(execution_context)
        [ 'instruction', 'all' ].include?(execution_context)
      end

      def execute_run_program?(execution_context)
        [ 'run', 'all' ].include?(execution_context)
      end

      def execute(program_id, run, user_id)
        program = Program.find(program_id)

        execution = ProgramExecution.create!(
          user_id: user_id,
          run: run,
          program: program
        )

        ExecuteProgramJob.new.perform(execution.id)
        execution.reload
        resource = Api::V1::ProgramExecutionResource.new(execution, context)
        Api::V1::ProgramExecutionResource.serializer.serialize_to_hash(resource)
      end

      def create_post_instruction_program_executions(per_inst_program_id, run)
        run.instructions.where.not(data_name: nil).map do |inst|
          ProgramExecution.create!(
            program_id: per_inst_program_id,
            instruction: inst,
            user_id: current_user.id
          )
        end
      end

      def create_post_run_program_executions(program_id, run)
        ProgramExecution.create!(
          program_id: program_id,
          run_id: run.id,
          user_id: current_user.id
        )
      end
    end
  end
end
