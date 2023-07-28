require 'base_resource'

module Api
  module V1
    class ProvisionSpecResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :instruction_id
      add_attribute :transfers
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :resource_id

      filter :run_id, apply: lambda { |records, run_id, _options|
        records.joins(instruction: :run)
                              .where(instructions: { run_id: run_id })
      }
    end
  end
end
