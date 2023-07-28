require 'base_resource'

module Api
  module V1
    class FavoriteResource < ::Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :updated_at
      add_attribute :created_at
      add_attribute :user_id
      add_attribute :favorable_type
      add_attribute :favorable_id

      filter :favorable_type

      has_one :user
    end
  end
end
