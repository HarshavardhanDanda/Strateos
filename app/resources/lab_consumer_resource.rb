require 'base_resource'

module Api
  module V1
    class LabConsumerResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      filter :organization_id
      filter :lab_id

      filter :org_name, apply: lambda { |records, names, _options|
        records.joins("INNER JOIN organizations ON lab_consumers.organization_id = organizations.id")
               .where("organizations.name ILIKE ?", "%#{names.first}%")
      }

      def self.sortable_fields(context)
        super + [ :"lab.name" ]
      end

      has_one :lab
      has_one :organization
    end
  end
end
