require 'base_resource'

module Api
  module V1
    class ContextualCustomPropertyResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :context_type
      add_attribute :context_id
      add_attribute :value
      add_attribute :key

      def key
        @model.contextual_custom_properties_config.key
      end

      def self.updatable_fields(_context)
        [ :value ]
      end
    end
  end
end
