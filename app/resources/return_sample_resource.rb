require 'base_resource'

module Api
  module V1
    class ReturnSampleResource < Api::BaseResource
      key_type :integer

      add_attribute :container_id
      add_attribute :created_at
      add_attribute :return_shipment_id
      add_attribute :updated_at

      has_one :container
      has_one :return_shipment
    end
  end
end
