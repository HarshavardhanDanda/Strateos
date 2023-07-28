module Api
  module V1
    class ProjectsController < Api::ApiController
      before_action :authorize_update, only: [ :update ]

      private

      def authorize_update
        project = Project.find(params.require(:id))
        authorize(project, :update?)

        permitted_update_params = project_update_params
        implementation_project_param = permitted_update_params.extract!(:is_implementation)

        if !implementation_project_param[:is_implementation].nil?
          if project.is_hidden && !implementation_project_param[:is_implementation] &&
            !project.runs.where(status: Run::OPEN_STATES).empty?

            project.errors.add(:is_implementation, :invalid_run_status)
            raise_jsonapi_validation_error(project)
          end

          if !project.is_hidden && implementation_project_param[:is_implementation]
            project.errors.add(:is_implementation, :already_visible)
            raise_jsonapi_validation_error(project)
          end
        end
      end

      def raise_jsonapi_validation_error(project)
        project_resource = Api::V1::ProjectResource.new(project, context)
        raise JSONAPI::Exceptions::ValidationErrors.new(project_resource)
      end

      def project_update_params
        params.require(:data).require(:attributes)
              .permit(:is_implementation)
      end
    end
  end
end
