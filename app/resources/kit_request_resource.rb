require 'base_resource'

module Api
  module V1
    class KitRequestResource < Api::BaseResource
      add_attribute :created_at
      add_attribute :fulfilled_at
      add_attribute :orderable_material_id
      add_attribute :organization_id
      add_attribute :quantity
      add_attribute :test_mode
      add_attribute :updated_at
      add_attribute :user_id

      has_many :containers
      has_one :orderable_material
      has_one :organization
      has_one :user
    end
  end
end
