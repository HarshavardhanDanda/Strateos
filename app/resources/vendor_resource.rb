require 'base_resource'

module Api
  module V1
    class VendorResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :name
      add_attribute :updated_at
      add_attribute :vendor_has_materials

      has_many :materials
      filters :name

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end

    end
  end
end
