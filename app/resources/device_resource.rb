require 'base_resource'

module Api
  module V1
    class DeviceResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :device_class
      add_attribute :device_events
      add_attribute :manufacturer
      add_attribute :model
      add_attribute :name
      add_attribute :updated_at
      add_attribute :serial_number
      add_attribute :work_unit_id
      add_attribute :work_unit_name

      add_attribute :manufactured_at
      add_attribute :purchased_at
      add_attribute :location_id

      def work_unit_name
        @model.work_unit&.name
      end

      def self.creatable_fields(context)
        super + [ :id ]
      end

      has_many :containers
      has_many :device_events
      has_one  :location

      filter :active_work_units, apply: lambda { |records, is_active = true, _options|
        records.by_active_work_units(is_active)
      }
    end
  end
end
