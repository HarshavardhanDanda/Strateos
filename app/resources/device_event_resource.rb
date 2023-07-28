require 'base_resource'

module Api
  module V1
    class DeviceEventResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      key_type :integer

      add_attribute :created_at
      add_attribute :date
      add_attribute :device_id
      add_attribute :event_type
      add_attribute :report_url
      add_attribute :updated_at

      has_one :device
    end
  end
end
