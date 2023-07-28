require 'base_resource'

module Api
  module V1
    class OrganizationResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash.dup
      end

      add_attribute :account_manager_id
      add_attribute :created_at
      add_attribute :default_payment_method_id
      add_attribute :name
      add_attribute :owner_id
      add_attribute :subdomain
      add_attribute :test_account
      add_attribute :updated_at
      add_attribute :api_key
      add_attribute :signals_api_key
      add_attribute :signals_tenant
      add_attribute :num_collaborators
      add_attribute :run_stats
      add_attribute :org_type
      add_attribute :validated
      add_attribute :two_factor_auth_enabled
      add_attribute :group
      add_attribute :netsuite_customer_id

      has_many :org_protocols
      has_one :owner, class_name: 'User'

      has_many :collaborators

      filter :shared_organization_by_protocol, apply: lambda { |records, protocol_id, _options|
        protocol = Protocol.find(protocol_id.first)
        owning_org_id = protocol.package.organization_id
        records.joins(:org_protocols)
               .where(org_protocols: { protocol_id: protocol_id })
               .where.not(org_protocols: { organization_id: owning_org_id })
      }

      def num_collaborators
        @model.num_collaborators
      end

      def run_stats
        @model.run_stats
      end

      def validated
        @model.validated?
      end

      def self.updatable_fields(_context)
        [ :netsuite_customer_id, :test_account ]
      end
    end
  end

  module V2
    class OrganizationResource < Api::V1::OrganizationResource
    end
  end
end
