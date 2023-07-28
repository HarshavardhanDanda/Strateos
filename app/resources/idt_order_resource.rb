require 'base_resource'

module Api
  module V1
    class IdtOrderResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :lab
      add_attribute :created_at
      add_attribute :order_placed_at
      add_attribute :order_number
      add_attribute :purchase_order
      add_attribute :updated_at
    end
  end
end
