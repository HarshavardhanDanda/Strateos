require 'base_resource'

module Api
  module V1
    class OrderableMaterialComponentResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :name
      add_attribute :no_of_units
      add_attribute :vol_measurement_unit
      add_attribute :mass_measurement_unit
      add_attribute :provisionable
      add_attribute :reservable
      add_attribute :indivisible
      add_attribute :dispensable
      add_attribute :volume_per_container
      add_attribute :mass_per_container
      add_attribute :reorder_point
      add_attribute :maximum_stock

      has_one :orderable_material
      has_one :material_component
      has_one :container_type

      def self.updatable_fields(_context)
        super - [ :orderable_material, :material_component ]
      end
    end
  end
end
