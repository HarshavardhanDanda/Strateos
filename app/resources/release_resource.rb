require 'base_resource'

module Api
  module V1
    class ReleaseResource < Api::BaseResource

      # attributes in this class are not available to its subclasses by default.
      # This callback copies this class's _attribute_hash to subclasses.
      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash
      end

      add_attribute :package_id
      add_attribute :version
      add_attribute :signature
      add_attribute :key_id
      add_attribute :format
      add_attribute :binary_attachment_hash
      add_attribute :binary_attachment_url
      add_attribute :status
      add_attribute :manifest
      add_attribute :validation_progress
      add_attribute :validation_errors
      add_attribute :published
      add_attribute :created_at
      add_attribute :updated_at

      has_many :protocols
      has_one  :package
    end
  end

  module V2
    class ReleaseResource < Api::V1::ReleaseResource
    end
  end
end
