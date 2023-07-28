require 'base_resource'

module Api
  module V1
    class OrderableMaterialResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :price
      add_attribute :margin
      add_attribute :sku
      add_attribute :tier

      has_one :material
      has_many :orderable_material_components
      has_many :kit_orders

      def self.updatable_fields(_context)
        super - [ :material ]
      end

      filter :id, apply: lambda { |records, id, options|
        options[:paginator] = nil
        records.where('orderable_materials.id IN (?)', id)
      }

      def fetchable_fields
        user_context = context[:user_context]
        permissions = user_context.permissions
        if user_context.organization.id == @model.organization.id &&
           permissions && permissions["org_ctx_permissions"]&.include?(MANAGE_KITS_VENDORS_RESOURCES)
          super
        else
          super - [ :price, :margin ]
        end
      end
    end
  end
end
