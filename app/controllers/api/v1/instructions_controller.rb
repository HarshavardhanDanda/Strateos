module Api
  module V1
    class InstructionsController < Api::ApiController
      def complete
        instruction = Instruction.find(params.require(:id))
        run         = instruction.run

        authorize(run, :instruction?)

        if run.started_at.nil? && !run.can_start?
          return render json: { error: 'Run cannot be started yet' }, status: :bad_request
        end

        # TODO: verify all dependencies of this instruction are already completed
        instruction.run.with_lock do
          has_completed = params[:completed]
          instruction.manual_complete(has_completed, current_user.id)
        end

        render json: instruction.as_json(Instruction.admin_short_json)
      end

      def undo
        instruction = Instruction.find(params.require(:id))
        authorize(instruction.run, :instruction?)
        if instruction.undo
          render json: instruction.to_json(Instruction.admin_short_json)
        else
          render json: { errors: instruction.errors }, status: :unprocessable_entity
        end
      end
    end
  end
end
