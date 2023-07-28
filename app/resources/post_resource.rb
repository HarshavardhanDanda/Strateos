require 'base_resource'

module Api
  module V1
    class PostResource < Api::BaseResource
      key_type :integer

      add_attribute :conversation_id
      add_attribute :author_id
      add_attribute :text
      add_attribute :attachments
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :author_type
      add_attribute :viewable_by_users

      has_one :author, polymorphic: true
      has_one :conversation
    end
  end
end
