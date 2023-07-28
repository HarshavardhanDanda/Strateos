require 'base_resource'

module Api
  module V1
    class LocationTypeResource < Api::BaseResource
      add_attribute :capacity
      add_attribute :category
      add_attribute :container_type_ids
      add_attribute :created_at
      add_attribute :name
      add_attribute :updated_at
      add_attribute :location_type_categories
    end
  end
end
