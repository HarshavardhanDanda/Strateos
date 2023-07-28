require 'base_resource'

module Api
  module V1
    class DataObjectResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :aliquot_id
      add_attribute :container_id
      add_attribute :content_type
      add_attribute :created_at
      add_attribute :dataset_id
      add_attribute :format
      add_attribute :name
      add_attribute :s3_info
      add_attribute :size
      add_attribute :status
      add_attribute :updated_at
      add_attribute :url
      add_attribute :validation_errors
      add_attribute :well_index

      filter :aliquot_id
      filter :container_id
      filter :dataset_id
      filter :format
      filter :name
      filter :status
      filter :well_index

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end
    end
  end
end
