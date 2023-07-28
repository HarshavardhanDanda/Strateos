require 'base_resource'

module Api
  module V1
    class ConversationResource < Api::BaseResource
      add_attribute :conversed_id
      add_attribute :conversed_type
      add_attribute :created_at
      add_attribute :organization_id
      add_attribute :participants
      add_attribute :updated_at

      has_many :posts
      has_one  :conversed, polymorphic: true
      has_one  :organization
    end
  end
end
