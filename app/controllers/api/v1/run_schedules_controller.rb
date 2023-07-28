module Api
  module V1
    class RunSchedulesController < Api::ApiController

      def create
        params_hash = params.to_unsafe_hash
        data = params_hash[:data]

        run_schedule_params = data[:attributes]
        run_schedule = RunSchedule.new(run_schedule_params)
        authorize(run_schedule, :create?)

        same_lab_error = run_schedule.same_lab(current_user, @organization, run_schedule_params['work_unit_id'])

        if !same_lab_error.nil?
          return render json: {
            error: same_lab_error
          }, status: :unprocessable_entity
        end

        if run_schedule.save
          render json: serialize_run_schedule(run_schedule), status: :created
        else
          render json: run_schedule.errors, status: :unprocessable_entity
        end
      end

      def delete_by_run
        run_schedule = RunSchedule.where(run_id: params.require(:run_id))
        authorize(run_schedule, :destroy?)

        run_schedule.destroy_all
        head :ok
      end

      private

      def serialize_run_schedule(run_schedule)
        resource = Api::V1::RunScheduleResource.new(run_schedule, context)
        serializer = Api::V1::RunScheduleResource.serializer
        serializer.serialize_to_hash(resource)
      end
    end
  end
end
