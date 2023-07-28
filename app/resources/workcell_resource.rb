require 'base_resource'

module Api
  module V1
    class WorkcellResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :workcell_id
      add_attribute :node_id
      add_attribute :is_test
      add_attribute :name
      add_attribute :region
      add_attribute :test_workcell
      add_attribute :uri_base
      add_attribute :workcell_type
      add_attribute :backend_address
      add_attribute :created_at
      add_attribute :updated_at

      filter :lab_id, apply: lambda { |records, lab_id, _options|
        records.by_lab_id(lab_id)
      }
    end
  end
end
