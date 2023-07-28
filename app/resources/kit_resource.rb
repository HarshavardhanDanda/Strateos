require 'base_resource'

module Api
  module V1
    class KitResource < Api::BaseResource
      add_attribute :cost
      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :name
      add_attribute :profit_margin
      add_attribute :sku
      add_attribute :total_units
      add_attribute :updated_at
      add_attribute :url
      add_attribute :vendor_id

      has_many :categories
      has_many :kit_items
      has_many :kit_orders
      has_many :resources
      has_one  :vendor
    end
  end
end
