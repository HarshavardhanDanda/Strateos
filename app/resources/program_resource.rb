require 'base_resource'

module Api
  module V1
    class ProgramResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :url
      add_attribute :command
      add_attribute :name
      add_attribute :user_id
      add_attribute :organization_id
      add_attribute :created_at
      add_attribute :updated_at

      has_one :user
      has_one :organization

      filter :user_id
      filter :organization_id
      filter :command
      filter :name
    end
  end
end
