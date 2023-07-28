require 'base_resource'

module Api
  module V1
    class ProtocolResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      # attributes in this class are not available to its subclasses by default.
      # This callback copies this class's _attribute_hash to subclasses.
      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash
      end

      add_attribute :categories
      add_attribute :command_string
      add_attribute :created_at
      add_attribute :description
      add_attribute :display_name
      add_attribute :image_url
      add_attribute :inputs
      add_attribute :license
      add_attribute :logo_url
      add_attribute :name
      add_attribute :outputs
      add_attribute :package_id
      add_attribute :package_name
      add_attribute :preview
      add_attribute :published
      add_attribute :release_id
      add_attribute :updated_at
      add_attribute :validation_url
      add_attribute :version

      has_one :package
      has_many :org_protocols

      filter :name

      filter :ownership, apply: lambda { |records, ownership, options|
        protocols = records.joins(:org_protocols).where(org_protocols: { organization_id:
                     options[:context][:current_organization].id, active: true })
        if ownership[0]==="owned"
          protocols.joins(:package)
          .where(packages: { organization_id: options[:context][:current_organization].id })
        elsif ownership[0]==="shared"
          protocols.joins(:package)
          .where.not(packages: { organization_id: options[:context][:current_organization].id })
        end
      }
    end
  end
  module V2
    class ProtocolResource < Api::V1::ProtocolResource
    end
  end
end
