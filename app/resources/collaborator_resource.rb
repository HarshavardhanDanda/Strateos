require 'base_resource'

module Api
  module V1
    class CollaboratorResource < Api::BaseResource
      key_type :integer

      add_attribute :collaborating_id
      add_attribute :collaborating_type
      add_attribute :collaborative_id
      add_attribute :collaborative_type
      add_attribute :created_at
      add_attribute :updated_at

      has_one :collaborating, polymorphic: true
      has_one :collaborative, polymorphic: true
    end
  end
end
