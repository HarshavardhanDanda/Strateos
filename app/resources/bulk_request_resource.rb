require 'base_resource'

module Api
  module V1
    class BulkRequestResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :deleted_at
      add_attribute :completed_at
      add_attribute :context_type
      add_attribute :bulk_action
      add_attribute :search_query
      add_attribute :additional_data
      add_attribute :expected_records
      add_attribute :result_success
      add_attribute :result_errors
      add_attribute :attachments
      add_attribute :failed_with_errors

      has_one :organization
      has_one :created_by
    end
  end
end
