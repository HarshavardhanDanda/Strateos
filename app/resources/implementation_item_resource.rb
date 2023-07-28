require 'base_resource'

module Api
  module V1
    class ImplementationItemResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name
      add_attribute :shipment_id
      add_attribute :quantity
      add_attribute :container_type
      add_attribute :storage_condition
      add_attribute :note
      add_attribute :checked_in_at
      add_attribute :created_at
      add_attribute :location
      has_one :shipment

      filter :shipment_id
    end
  end
end
