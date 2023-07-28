require 'base_resource'

module Api
  module V1
    class AddressResource < ::Api::BaseResource
      add_attribute :attention
      add_attribute :city
      add_attribute :country
      add_attribute :created_at
      add_attribute :organization_id
      add_attribute :state
      add_attribute :street
      add_attribute :street_2
      add_attribute :updated_at
      add_attribute :zipcode

      has_one :organization
    end
  end
end
