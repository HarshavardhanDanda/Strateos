require 'base_resource'

module Api
  module V1
    class MaterialComponentResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :material_id
      add_attribute :resource_id
      add_attribute :concentration

      has_one :material
      has_one :resource
      has_many :orderable_material_components

      filter :resource_id

      filter :provisionable, apply: lambda { |records, value, _options|
        return records if value.empty?
        records.filter_by_provisionable(value[0])
      }

    end
  end
end
