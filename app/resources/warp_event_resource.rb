require 'base_resource'

module Api
  module V1
    class WarpEventResource < Api::BaseResource
      key_type :integer

      add_attribute :warp_id
      add_attribute :warp_state
      add_attribute :created_at
      add_attribute :updated_at

      has_one :warp
    end
  end
end
