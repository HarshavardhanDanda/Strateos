require 'base_resource'

module Api
  module V1
    class ContextualCustomPropertiesConfigResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :context_type
      add_attribute :config_definition
      add_attribute :key
      add_attribute :organization_id

      filter :organization_id
      filter :context_type

      has_one :organization
    end
  end
end
