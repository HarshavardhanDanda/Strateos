require 'base_resource'

module Api
  module V1
    class NotebookResource < Api::BaseResource
      add_attribute :content_raw
      add_attribute :created_at
      add_attribute :forked_parent_id
      add_attribute :format
      add_attribute :mimetype
      add_attribute :name
      add_attribute :path
      add_attribute :project_id
      add_attribute :updated_at
      add_attribute :user_id

      # type is reserved keyword
      # need to handle polymorphic resources better.
      #   add_attribute :type

      has_one :project
      has_one :user
    end
  end
end
