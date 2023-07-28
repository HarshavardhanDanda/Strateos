module Api
  module V1
    class ProgramsController < Api::ApiController
      def create
        upload_id = params.require(:upload_id)
        command   = params.require(:command)
        name      = params.require(:name)
        org_id    = params.require(:organization_id)

        org = Organization.find(org_id)
        authorize(org, :member?)

        upload = Upload.find(upload_id)
        authorize(upload, :show?)

        program = Program.create(
          s3_key: upload.key,
          s3_bucket: upload.bucket,
          user_id: current_user.id,
          organization_id: org_id,
          command: command,
          name: name
        )
        resource = Api::V1::ProgramResource.new(program, context)

        if program.save
          SlackMessageForProgramLifecycleJob.perform_async('program_create', program.id)

          serializer = Api::V1::ProgramResource.serializer()
          json = serializer.serialize_to_hash(resource)

          render json: json
        else
          error = JSONAPI::Exceptions::ValidationErrors.new(resource)
          render_api_exception(error)
        end
      end
    end
  end
end
