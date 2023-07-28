require 'base_resource'

module Api
  module V1
    class KitOrderResource < Api::BaseResource
      add_attribute :checked_in_at
      add_attribute :count
      add_attribute :created_at
      add_attribute :note
      add_attribute :received_at
      add_attribute :state
      add_attribute :tracking_code
      add_attribute :updated_at
      add_attribute :vendor_order_id

      has_one :orderable_material
      has_one :lab
      has_one :user

      filter :id, apply: lambda { |records, value, options|
        options[:paginator] = nil
        records.where('id IN (?)', value)
      }
    end
  end
end
