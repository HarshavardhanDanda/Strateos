require 'base_resource'

module Api
  module V1
    class RecipeResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :label
      add_attribute :description

      has_one :mixture
    end
  end
end
