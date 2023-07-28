require 'base_resource'

module Api
  module V1
    class LocationResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :location_type_id
      add_attribute :lock_version
      add_attribute :merged_properties
      add_attribute :name
      add_attribute :parent_id
      add_attribute :parent_path
      add_attribute :position
      add_attribute :properties
      add_attribute :updated_at
      add_attribute :row
      add_attribute :col
      add_attribute :human_path
      add_attribute :ancestors
      add_attribute :blacklist
      add_attribute :lab_id
      add_attribute :location_type

      filter :name

      has_many :children
      has_many :containers
      has_one  :location_type
      has_one  :parent

      filter :location_category,  apply: ->(records, value, _options) {
        records.where_location_category(value)
      }

      def human_path
        @model.human_path
      end

      def ancestors
        @model.ancestors_as_json_flat
      end
    end
  end
end
