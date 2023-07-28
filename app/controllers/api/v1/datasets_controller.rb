module Api
  module V1
    class DatasetsController < Api::ApiController

      # Allows users to create datasets via this post route
      # For now we only support three main usecases:
      # 1.  "Analysis" datasets - Allow users to hit this route with valid "analysis" datasets which have certain
      #     requirements -- run id, s3 key, etc.
      # 2.  Non-analysis datasets with s3 key/s3 bucket - This applies to cases where only run_id is present and when
      #     both warp_id and run_id are present.
      # 3.  Datasets directly containing data and some id - This primarily supports the insertion of scle-generated
      #     data. Note that this signature is unstable and subject to change.
      def create
        # The transcriptic CLI and webhook_experiments still use the `make_upload_uri` route
        # which doesn't force users to create an Upload object.
        # The Upload Api doesn't expose S3 buckets or keys to users.
        #
        # TODO: make users use an Upload object.
        user   = current_user || current_admin
        attributes = params[:data][:attributes] if params[:data]
        comment = attributes.present? && attributes[:comment]

        if attributes.nil?
          # Used by transcriptic CLI and webhook_experiments
          upload_type = 'analysis'
          comment = params[:comment]
        elsif attributes['s3_key'] && attributes['run_id'] && attributes['warp_id']
          upload_type = 's3_with_warp_and_run'
        elsif attributes['s3_key'] && attributes['run_id']
          upload_type = 's3_with_run_only'
        elsif attributes['id'] && attributes['data']
          # Used by scle-data processor
          upload_type = 'data_with_id'
        elsif attributes['instruction_id']
          upload_type = 's3_with_measurement_data'
        else
          raise ValidationError, "Unable to parse use-case based on provided attributes"
        end

        dataset_status = "unconverted"

        case upload_type
        when 'analysis'
          title                 = params.require(:title)
          run_id                = params.require(:run_id)
          analysis_tool         = params[:analysis_tool]
          analysis_tool_version = params[:analysis_tool_version]

          upload_id = params[:upload_id]
          s3_key = params[:s3_key]
          file_name = params[:file_name]

          validate_dataset(upload_id, s3_key, file_name)

          s3_bucket = S3_UPLOAD_BUCKET
          data_type = "file"

          if upload_id
            upload = Upload.find(upload_id)
            authorize(upload, :show?)
            s3_key    = upload.key
            file_name = upload.file_name
          end
          run = authorize_dataset(run_id)
          metadata = get_s3_metadata(s3_bucket, s3_key)

          dataset = Dataset.new(
            data_type: data_type,
            run: run,
            uploaded_by: user.id,
            run_id: run_id,
            title: title,
            analysis_tool: analysis_tool,
            analysis_tool_version: analysis_tool_version,
            status: dataset_status,
            metadata: metadata
          )

        when 'data_with_id'
          id = attributes.require(:id)
          warp_id = attributes.require(:warp_id)
          data_type = attributes.require(:data_type)
          data = attributes.require(:data)
          created_at = attributes.require(:created_at)

          # Attachments are optionally present. An empty array evaluates to false for `require`
          attributes.permit(:attachments)
          attachments = attributes.dig(:attachments)
          metadata = {}
          unless attachments.nil?
            if attachments.size == 0
              # do nothing
            elsif attachments.size == 1
              file_name = attachments.map{ |i| i.dig(:file_name) }.first
              s3_bucket = attachments.map{ |i| i.dig(:s3_bucket) }.first
              s3_key = attachments.map{ |i| i.dig(:s3_key) }.first
              metadata = get_s3_metadata(s3_bucket, s3_key)
            else
              raise ValidationError, ">1 attachments is not supported at this point of time"
            end
          end

          run_id = Warp.find(warp_id).run_id
          run = authorize_dataset(run_id)

          # Handle case where there may be a duplicate id
          resolved_id = resolve_maybe_duplicate_id(id, metadata)

          dataset = Dataset.new(
            id: resolved_id,
            data_type: data_type,
            data: data,
            run: run,
            uploaded_by: user.id,
            run_id: run_id,
            warp_id: warp_id,
            status: dataset_status,
            created_at: created_at,
            metadata: metadata
          )

        when 's3_with_warp_and_run'
          run_id = attributes.require(:run_id)
          warp_id = attributes.require(:warp_id)
          s3_bucket = attributes.require(:s3_bucket)
          s3_key = attributes.require(:s3_key)
          data_type = attributes.require(:data_type)

          file_name = attributes.permit(:file_name)

          validate_dataset(upload_id, s3_key, file_name)
          dataset_status = "unconverted"

          run = authorize_dataset(run_id)
          metadata = get_s3_metadata(s3_bucket, s3_key)

          dataset = Dataset.new(
            data_type: data_type,
            run: run,
            uploaded_by: user.id,
            run_id: run_id,
            warp_id: warp_id,
            status: dataset_status,
            metadata: metadata
          )

        when 's3_with_run_only'
          attributes = params.require(:data).require(:attributes)
          run_id = attributes.require(:run_id)
          s3_bucket = attributes.require(:s3_bucket)
          s3_key = attributes.require(:s3_key)
          data_type = attributes.require(:data_type)
          file_name = attributes.require(:file_name)

          permitted = attributes.permit(:analysis_tool, :analysis_tool_version, :title)
          analysis_tool = permitted[:analysis_tool]
          analysis_tool_version = permitted[:analysis_tool_version]
          title = permitted[:title]

          dataset_status = "unconverted"

          run = authorize_dataset(run_id)
          metadata = get_s3_metadata(s3_bucket, s3_key)

          dataset = Dataset.new(
            data_type: data_type,
            run: run,
            uploaded_by: user.id,
            run_id: run_id,
            status: dataset_status,
            title: title,
            metadata: metadata,
            analysis_tool: analysis_tool,
            analysis_tool_version: analysis_tool_version
          )

        when 's3_with_measurement_data'
          attributes = params.require(:data).require(:attributes)
          instruction_id = attributes.require(:instruction_id)
          data_type = attributes.require(:data_type)
          s3_bucket = attributes.require(:s3_bucket)
          s3_key = attributes.require(:s3_key)

          metadata = get_s3_metadata(s3_bucket, s3_key)

          dataset_status = "unconverted"

          instruction = Instruction.find(instruction_id)

          dataset = Dataset.new(
            data_type: data_type,
            uploaded_by: user.id,
            instruction: instruction,
            status: dataset_status,
            metadata: metadata
          )
        end

        # Associate attachments if there are relevant s3_bucket/s3_keys defined.
        if s3_bucket != nil and s3_key != nil
          dataset.attachments << { name: file_name, bucket: s3_bucket, key: s3_key }
        end

        if comment.present?
          dataset.audit_comment = comment
        end

        if dataset.save!
          Rails.logger.info("[DatasetsController] Saving dataset_id: #{dataset.id} of type: #{upload_type}.")
        end

        json = serialize_to_json(dataset)
        render json: json, status: :created
      rescue ValidationError => e
        render json: { "error": e.message }, status: :bad_request
      end

      # redirects to zipper, zipping all data objects in dataset or specific ones.
      def zip
        id      = params.require(:id)
        dataset = Dataset.where(id: id, status: 'converted').first

        if dataset.nil?
          return render json: { errors: 'Data is not yet available' }, status: :not_found
        end

        authorize(dataset, :show?)

        dataset_objects_ids = DataObject.where(dataset_id: id).pluck(:id)

        # can optionally specify subset of objects
        ids =
          if params[:ids]
            params[:ids].split(',').map(&:strip)
          else
            dataset_objects_ids
          end

        invalid_ids = ids - dataset_objects_ids

        if !invalid_ids.empty?
          raise ValidationError, "All data object ids must be within dataset #{dataset.id}"
        end

        if ids.empty?
          return render json: { errors: 'Data is not yet available' }, status: :bad_request
        end

        data_objects = DataObject.where(id: ids)

        url = "#{S3ZIPPER_SERVICE_URL}/zip"
        resp = Excon.post(url, {
          body: denormalize(data_objects).to_json
        })

        response.headers['Content-Disposition'] = "attachment; filename=#{id}_data_files.zip"
        response.headers['Content-Type'] = resp.headers['Content-Type']
        self.response_body = resp.body
      end

      def zip_run_data
        run_id = params.require(:run_id)
        run    = Run.find(run_id)
        authorize(run, :show?)

        run_dataset_ids = run.datasets.where(status: 'converted').pluck(:id)

        if params[:dataset_ids]
          dataset_ids = JSON.parse(params[:dataset_ids])
          if !dataset_ids.all? { |dataset_id| run_dataset_ids.include?(dataset_id) }
            return render_error("Not_Found", status: :not_found, code: "404", detail: "Data is not available")
          end
        else
          dataset_ids = run_dataset_ids
        end

        if dataset_ids.empty?
          return render json: { errors: 'Data is not yet available' }, status: :bad_request
        end

        data_objects = DataObject.where(dataset_id: dataset_ids)

        url = "#{S3ZIPPER_SERVICE_URL}/zip"
        resp = Excon.post(url, {
          body: denormalize(data_objects).to_json
        })
        response.headers['Content-Disposition'] = "attachment; filename=#{run_id}_data_files.zip"
        response.headers['Content-Type'] = resp.headers['Content-Type']
        self.response_body = resp.body

      end

      def prime_directive
        instruction = Instruction.find(params.require(:instruction_id))
        authorize(instruction.run, :instruction?)
        if instruction.dataset.present?
          return render json: { error: "Dataset already exists" }, status: :conflict
        end

        dataset, errors = Dataset.from_data(instruction, params[:data], params[:parameters])

        if errors.empty?
          json = instruction.as_json(Instruction::SHORT_JSON)
          json['dataset'] = dataset.as_json(include: {}, methods: [])
          render json: json, status: :created
        else
          render json: { errors: errors }, status: :unprocessable_entity
        end
      end

      def destroy
        dataset = Dataset.find(params.require(:id))
        authorize(dataset.instruction.run, :instruction?)
        if !dataset.manually_created?
          return render json: { error: "Can only delete manually created datasets" }, status: :forbidden
        end

        if dataset.destroy
          instruction = dataset.instruction
          render json: instruction.as_json(Instruction::SHORT_JSON)
        else
          render json: dataset.errors, status: :unprocessable_entity
        end
      end

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "id" , "type", "attributes" ], additionalProperties: false,
        properties: {
          type: { type: "string" },
          id: { type: "string" },
          attributes: {
            type: "object", required: [ "status" ], additionalProperties: false,
            properties: {
              status: { type: "string", enum: [ "processing", "converted" ] }
            }
          }
        }
      }

      def update
        id   = params.require(:id)
        data = params.require(:data).to_unsafe_hash

        validate_json(UPDATE_SCHEMA, data)

        # Only existing datasets should be updated
        scope = Pundit.policy_scope!(pundit_user, Dataset)
        dataset = scope.find(id)
        authorize(dataset, :update?)

        dataset.update!(data['attributes'])

        # generate json response
        resource = Api::V1::DatasetResource.new(dataset, context)
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::DatasetResource)
        json = serializer.serialize_to_hash(resource)

        render json: json
      end

      def denormalize(data_objects)
        # Construct entries to be eventually inserted in redis and consumed by zipper service
        # note: DatasetId is not part of the expected struct, will be deleted later
        extracted_data = data_objects.map do |obj|
          {
            FileName: obj.name || obj.id,
            S3Bucket: obj.s3_bucket,
            S3Path: obj.s3_key,
            DatasetId: obj.dataset_id
          }
        end

        ## Duplicated filenames may exist within the same run, e.g. multiple platereader datasets
        data_by_filenames = extracted_data.group_by { |d| d[:FileName] }
        # Find and update datasets with duplicated filenames
        data_by_filenames.each do |filename, ds|
          # if there is a single dataset, leave filename unchanged
          next if ds.size == 1

          # if there are duplicated filenames, try using dataset-id
          ds.group_by { |obj| obj[:DatasetId] }.each do |dataset_id, matched_data|
            ext      = File.extname(filename)
            basename = File.basename(filename, ext)

            # if the dataset-id is non-unique, append index
            matched_data.each_with_index do |d, i|
              identifier = if i == 0
                             dataset_id.to_s
                           else
                             "#{dataset_id}_#{i}"
                           end
              d[:FileName] = "#{basename}_#{identifier}#{ext}"
            end
          end
        end

        # Remove DatasetId field to conform to the expected format
        extracted_data.map { |d| d.except("DatasetId") }
      end

      private

      def serialize_to_json(dataset)
        resource    = Api::V1::DatasetResource.new(dataset, context)
        serializer  = JSONAPI::ResourceSerializer.new(Api::V1::DatasetResource)
        json        = serializer.serialize_to_hash(resource)
      end

      private

      def add_dataobjects_to_redis(data_objects)
        # set random key in redis, expire in 60 seconds
        key = SecureRandom.hex(48)
        REDIS_CLIENT.set(key, denormalize(data_objects).to_json, ex: 60)
        key
      end

      private

      def get_s3_metadata(s3_bucket, s3_key)
        s3_object = S3Helper.instance.object(s3_bucket, s3_key)
        if !s3_object.exists?
          raise ValidationError, "There is no s3 file for the given key: #{s3_key}"
        end

        metadata = S3Helper.instance.metadata(s3_bucket, s3_key)
        size     = metadata.size
        max      = S3Helper::SINGLE_FILE_MAX_SIZE

        if size > max
          raise ValidationError, "File too large: File size is #{size}, but max size is #{max}"
        end
        metadata
      end

      private

      # If the data id is already present, we merge the existing id into the metadata and return nil so that a new id
      # can be generated
      def resolve_maybe_duplicate_id(id, metadata)
        existing_dataset = Dataset.find_by(id: id)
        if existing_dataset
          metadata.merge!("existing_id": id)
          id = nil
        end
        id
      end

      private def authorize_dataset(run_id)
        run = Run.find(run_id)
        unless authorize(run, :upload_dataset?)
          Rails.logger.error("[DatasetsController] Dataset not authorized for run_id: #{run_id}.")
        end
        run
      end

      private

      def validate_dataset(upload_id, s3_key, file_name)
        if !(upload_id.present? ^ (s3_key.present? && file_name.present?))
          Rails.logger.error("[DatasetsController] Must specify an upload_id or the s3_key and file_name.")
          raise ValidationError, "Must specify an upload_id or the s3_key and file_name"
        end
      end
    end
  end
end

class ValidationError < StandardError
  def initialize(err_str)
    @err_str = err_str
  end

  def message
    @err_str
  end
end
