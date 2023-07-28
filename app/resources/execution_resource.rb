require 'base_resource'

module Api
  module V1
    class ExecutionResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :run_id
      add_attribute :environment
      add_attribute :descendents

      filter :run_id

      def self.creatable_fields(_context)
        [ :run_id ]
      end

      def self.updatable_fields(_context)
        [ :environment ]
      end

      def environment
        @model.get_env
      end

      def environment=(env)
        @model.set_env(env.to_unsafe_h)
      end

      def descendents
        @model.descendents
      end
    end
  end
end
