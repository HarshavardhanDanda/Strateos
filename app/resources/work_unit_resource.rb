require 'base_resource'

module Api
  module V1
    class WorkUnitResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name
      add_attribute :lab_id
      add_attribute :inactive

      filter :inactive, default: 'false'

      filter :organization_id, apply: lambda { |records, organization_id, _options|
        records.by_lab_operator(organization_id)
      }
      filter :lab_id, apply: lambda { |records, lab_id, _options|
        records.where(lab_id: lab_id).where.not(workcell_id: nil)
      }
    end
  end
end
