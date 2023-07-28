require 'base_resource'

module Api
  module V1
    class LaunchRequestResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :autoprotocol
      add_attribute :created_at
      add_attribute :generation_errors
      # TODO: deprecate this feild. This is a partially mutated form of
      # the original inputs. Hard to do anything with this data.
      add_attribute :inputs
      add_attribute :organization_id
      add_attribute :progress
      add_attribute :protocol_id
      add_attribute :raw_input
      add_attribute :test_mode
      add_attribute :updated_at
      add_attribute :user_id
      add_attribute :validated_at
      add_attribute :input_file_attributes

      def self.updatable_fields(_context)
        [ :input_file_attributes ]
      end
    end
  end
end
