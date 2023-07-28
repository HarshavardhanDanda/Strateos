require 'base_resource'

module Api
  module V1
    class ShipmentResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :checked_in_at
      add_attribute :contact_name
      add_attribute :contact_number
      add_attribute :container_transfer_id
      add_attribute :created_at
      add_attribute :data
      add_attribute :editable
      add_attribute :label
      add_attribute :name
      add_attribute :note
      add_attribute :organization_id
      add_attribute :pickup_street
      add_attribute :pickup_zipcode
      add_attribute :receiving_note
      add_attribute :scheduled_pickup
      add_attribute :shipment_type
      add_attribute :shipped_at
      add_attribute :lab_id
      add_attribute :updated_at
      add_attribute :container_ids
      add_attribute :organization
      add_attribute :packing_url
      has_one  :lab

      has_many :containers
      has_one  :organization

      def container_ids
        @model.containers.pluck(:id)
      end

      def organization
        { id: @model.organization.id, name: @model.organization.name }
      end

      filter :lab_id

      filter :checked_in, apply: lambda { |records, values, _options|
        pending = values.include?('pending')
        completed = values.include?('completed')

        if pending && completed
          records.where('checked_in_at >= ?', Date.today.prev_month).or(records.where(checked_in_at: nil))
                 .order(created_at: :desc)
        elsif completed
          records.where('checked_in_at >= ?', Date.today.prev_month).order(created_at: :desc)
        elsif pending
          records.where(checked_in_at: nil).order(created_at: :desc)
        end
      }

      filter :organization_id

      filter :shipment_type, apply: lambda { |records, shipment_type, options|
        records.where(shipment_type: shipment_type).order(created_at: :desc)
      }
    end
  end
end
