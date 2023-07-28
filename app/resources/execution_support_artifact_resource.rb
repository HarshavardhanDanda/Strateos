module Api
  module V1
    class ExecutionSupportArtifactResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      has_many :instructions, always_include_linkage_data: true

      add_attribute :name
      add_attribute :comment
      add_attribute :operation
      add_attribute :status
      add_attribute :generation_errors
      add_attribute :created_at
      add_attribute :vendor

      add_attribute :s3_bucket, default: false
      add_attribute :s3_key, default: false
      add_attribute :presigned_url, default: false

      def presigned_url
        raise JSONAPI::Exceptions::InvalidFieldValue.new(:s3_bucket, @model.s3_bucket) unless @model.s3_bucket.present?
        raise JSONAPI::Exceptions::InvalidFieldValue.new(:s3_key, @model.s3_key) unless @model.s3_key.present?
        S3Helper.instance.url_for(@model.s3_bucket, @model.s3_key, response_content_disposition:
          "attachment;filename=\"#{@model.name}\"")
      end

      filter :operation
      filter :status, default: "generated"
      filter :vendor

      # Add support to filter ESAs that contain all of the instructions provided
      filter :includes_all_instruction_ids, apply: ->(records, value, _options) { records.with_instructions(value) }

      # Override default count_records strategy due to includes_all_instruction_ids
      #filter having an aggregation function in the
      # select query
      def self.count_records(records)
        records.load.size
      end

      def sortable_fields
        [ :created_at ]
      end

      def self.default_sort
        [ { field: :created_at, direction: :desc } ]
      end
    end
  end
end
