module Api
  module V1
    class DataObjectsController < Api::ApiController

      def create
        # pull out required params
        attributes   = params.require(:data).require(:attributes)
        name         = attributes.require(:name)
        format       = attributes.require(:format)
        upload_id    = attributes.require(:upload_id)
        dataset_id   = attributes.require(:dataset_id)

        permitted = attributes.permit(:container_id)
        container_id = permitted.dig(:container_id)

        # fetch records from db using policy scopes.
        upload    = find_scope(pundit_user, Upload).find(upload_id)
        dataset   = find_scope(pundit_user, Dataset).find(dataset_id)
        container = find_scope(pundit_user, Container).find(container_id) if container_id

        # pull out aliquot which might be nil
        aliquot =
          if container and attributes[:aliquot_id]
            find_scope(pundit_user, Aliquot).find_by!(container_id: container.id, id: attributes[:aliquot_id])
          elsif container and attributes[:well_index]
            ctype            = container.container_type
            robot_well_index = ctype.robot_well(attributes[:well_index])

            find_scope(pundit_user, Aliquot).find_by!(container_id: container.id, well_idx: robot_well_index)
          else
            nil
          end

        authorize(DataObject, :create?)
        authorize(upload, :show?)
        authorize(dataset, :attach_data_object?)

        # Make sure we are attaching to a dataset whose run has refs to the container.
        # Add run_id to all datasets and we can avoid fetching the run.
        run = dataset.run
        if container and !Ref.where(run_id: run.id, container_id: container.id).exists?
          return render_error("Container #{container.id} not used within the run: #{run.id}")
        end

        # check that a file actually exists in s3
        if !upload.s3_exists?
          return render_error("There is no s3 file for the given upload: #{upload.id}")
        end

        metadata = upload.s3_metadata

        data_object = DataObject.new(
          dataset_id: dataset.id,
          container_id: container&.id,
          aliquot_id: aliquot.try(:id),
          well_index: aliquot.try(:well_idx),
          validation_errors: [],

          size: metadata[:size],
          content_type: metadata[:content_type],
          format: format,
          name: name,
          s3_bucket: upload.bucket,
          s3_key: upload.key,
          status: DataObject::UNVERIFIED
        )

        resource = Api::V1::DataObjectResource.new(data_object, context)

        if data_object.save
          serializer = Api::V1::DataObjectResource.serializer()
          json       = serializer.serialize_to_hash(resource)

          # launch finalizer job to verify.
          DataObjectFinalizerJob.perform_async(data_object.id)

          render json: json, status: :created
        else
          e = JSONAPI::Exceptions::ValidationErrors.new(resource)
          render_api_exception(e)
        end
      end

      private

      def find_scope(pundit_user, clazz)
        Pundit.policy_scope!(pundit_user, clazz)
      end
    end
  end
end
