require 'base_resource'

module Api
  module V1
    class KitItemResource < Api::BaseResource
      add_attribute :concentration
      add_attribute :container_type_id
      add_attribute :deleted_at
      add_attribute :dispensable
      add_attribute :kit_id
      add_attribute :provisionable
      add_attribute :reservable
      add_attribute :indivisible
      add_attribute :resource_id
      add_attribute :volume_ul
      add_attribute :mass_mg

      has_one :container_type
      has_one :kit
      has_one :resource
    end
  end
end
