require 'base_resource'

module Api
  module V1
    class CreditResource < Api::BaseResource
      add_attribute :name
      add_attribute :organization_id
      add_attribute :amount
      add_attribute :amount_remaining
      add_attribute :project_id
      add_attribute :credit_type
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :expires_at

      has_one :organization
      has_one :project

      def self.creatable_fields(context)
        super - [ :amount_remaining, :created_at, :updated_at ]
      end
    end
  end
end
