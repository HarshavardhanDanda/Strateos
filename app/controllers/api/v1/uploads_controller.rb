module Api
  module V1
    class UploadsController < Api::ApiController

      MAX_PARTS = 10_000

      def create
        authorize(Upload, :create?)

        # Initiate a new multipart upload or resume an existing upload if the signature matches
        attrs        = params.require(:data).require(:attributes)
        file_name    = attrs.require(:file_name)
        file_size    = attrs.require(:file_size)
        mtime        = attrs[:last_modified] || Time.now
        is_multipart = attrs[:is_multipart] || false
        user         = (current_user || current_admin)
        bucket       = attrs[:bucket] || S3_UPLOAD_BUCKET # currently fixed, will change
        key          = attrs[:key] || AwsHelper.safe_key("uploads/#{SecureRandom.uuid}/#{file_name}")

        upload = Upload.incomplete.where(user: user,
                                         file_name: file_name,
                                         file_size: file_size,
                                         last_modified: mtime).first_or_initialize

        if upload.new_record?
          upload.key          = key
          upload.bucket       = bucket
          upload.is_multipart = is_multipart

          if is_multipart
            multipart_upload     = S3Helper.instance.client.create_multipart_upload(bucket: bucket, key: key)
            upload.aws_upload_id = multipart_upload.upload_id
            upload.state         = Upload::STATE_NEW
          else
            upload.state = Upload::STATE_COMPLETE
          end
        end

        resource = Api::V1::UploadResource.new(upload, context)

        if upload.save
          serializer = Api::V1::UploadResource.serializer(include_nondefault: true)
          json       = serializer.serialize_to_hash(resource)

          render json: json
        else
          raise JSONAPI::Exceptions::ValidationErrors.new(resource)
        end
      end

      def destroy
        upload = find_upload()
        authorize(upload, :destroy?)

        if upload.is_multipart
          # Delete the multi part upload
          S3Helper.instance.client.abort_multipart_upload({
            bucket: upload.bucket,
            key: upload.key,
            upload_id: upload.aws_upload_id
          })
        end

        # Delete the object
        DeleteS3ItemJob.perform_async(upload.bucket, upload.key)

        # Destory the upload record
        upload.destroy

        head :no_content
      end

      # Upload a file part
      def upload_part
        upload = find_upload()
        authorize(upload, :upload_part?)

        if !upload.is_multipart
          e = BadParam.new(:id, upload.id, "Cannnot upload_part for non multipart upload")
          return render_api_exception(e)
        end

        data       = params.require(:data)
        part_index = data.require(:index)
        part_size  = data.require(:size)
        md5        = data.require(:md5)

        if part_index < 1 || part_index > MAX_PARTS
          e = BadParam.new(:index, part_index, "part_index must be between 1 and #{MAX_PARTS}, inclusive")
          return render_api_exception(e)
        end

        # Create or update the upload part
        part              = UploadPart.where(upload_id: upload.id, part_index: part_index).first_or_initialize
        part.part_size    = part_size
        part.md5_checksum = md5

        signer = Aws::S3::Presigner.new(client: S3Helper.instance.client_with_bucket_region(upload.bucket))

        # AWS wants the md5 base 64 encoded. This converts our MD5 32 char hex into
        # a base64 encoded binary checksum. It's magic, but it works
        md5_base64 = [ [ md5 ].pack("H*") ].pack("m0")

        url = signer.presigned_url(:upload_part, {
          bucket: upload.bucket,
          key: upload.key,
          part_number: part_index,
          upload_id: upload.aws_upload_id,
          content_md5: md5_base64
        })

        # headers that the client must set
        headers = {
          "Content-MD5" => md5_base64
        }

        upload.update!(state: Upload::STATE_IN_PROGRESS)

        if part.save
          render json: { index: part_index, url: url, headers: headers }
        else
          render json: { errors: part.errors }, status: :bad_request
        end
      end

      def complete
        upload = find_upload()
        authorize(upload, :complete?)

        if !upload.is_multipart
          e = BadParam.new(:id, upload.id, "Cannnot upload_part for non multipart upload")
          return render_api_exception(e)
        end

        s3_client = S3Helper.instance.client

        parts = upload.upload_parts.map do |part|
          { etag: part.md5_checksum, part_number: part.part_index }
        end

        sorted_parts = parts.sort_by { |part| part[:part_number] }

        s3_client.complete_multipart_upload(
          bucket: upload.bucket,
          key: upload.key,
          upload_id: upload.aws_upload_id,
          multipart_upload: {
            parts: sorted_parts
          }
        )

        upload.update!(state: Upload::STATE_COMPLETE)

        resource   = Api::V1::UploadResource.new(upload, context)
        serializer = Api::V1::UploadResource.serializer()
        json       = serializer.serialize_to_hash(resource)

        render json: json
      end

      private

      def find_upload
        id         = params.require(:id)
        user_scope = Pundit.policy_scope!(pundit_user, Upload)

        upload = user_scope.find_by(id: id)

        if upload.nil?
          raise JSONAPI::Exceptions::RecordNotFound.new(id)
        end

        upload
      end
    end
  end
end
