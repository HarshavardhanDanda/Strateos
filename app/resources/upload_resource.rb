require 'base_resource'

module Api
  module V1
    class UploadResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :file_name
      add_attribute :file_size
      add_attribute :is_multipart
      add_attribute :last_modified
      add_attribute :state
      add_attribute :updated_at
      add_attribute :upload_parts, default: false
      add_attribute :url
      add_attribute :upload_url
      add_attribute :key

      def upload_parts
        # return parts from S3 and not our upload_parts from the DB
        # TODO: just maintaining current behavior, is this a good idea?
        @model.upload_parts_from_s3
      rescue Aws::S3::Errors::NoSuchUpload
        []
      end

      filter :file_name
      filter :file_size
      filter :last_modified
      filter :state

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end
    end
  end
end
