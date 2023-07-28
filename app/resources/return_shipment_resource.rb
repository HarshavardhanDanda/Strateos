require 'base_resource'

module Api
  module V1
    class ReturnShipmentResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :address_id
      add_attribute :carrier
      add_attribute :created_at
      add_attribute :delivery_date
      add_attribute :ep_label_url
      add_attribute :ep_shipment_id
      add_attribute :invoice_item_id
      add_attribute :organization_id
      add_attribute :quote
      add_attribute :speed
      add_attribute :status
      add_attribute :temp
      add_attribute :tracking_message
      add_attribute :tracking_number
      add_attribute :updated_at
      add_attribute :weight
      add_attribute :lab_id
      add_attribute :container_ids
      add_attribute :is_courier_pickup

      has_many :containers
      has_many :return_samples
      has_one :address
      has_one :invoice_item
      has_one :organization

      filter :status
      filter :organization_id

      def container_ids
        @model.containers.pluck(:id)
      end

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end
    end
  end
end
