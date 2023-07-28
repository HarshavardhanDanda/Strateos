require 'base_resource'

module Api
  module V1
    class TisoReservationResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :device_id
      add_attribute :run_execution_id
      add_attribute :run_id
      add_attribute :instruction_id
      add_attribute :container_id
      add_attribute :slot

      has_one :device

      filter :location_id, apply: lambda { |records, location_ids, _options|
        records.joins(:device).where(devices: { location_id: location_ids })
      }

    end
  end
end
