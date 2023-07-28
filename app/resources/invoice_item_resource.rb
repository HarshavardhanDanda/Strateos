require 'base_resource'

module Api
  module V1
    class InvoiceItemResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :category
      add_attribute :charge
      add_attribute :created_at
      add_attribute :credit_id
      add_attribute :description
      add_attribute :invoice_id
      add_attribute :name
      add_attribute :organization_id
      add_attribute :payment_method_id
      add_attribute :project_id
      add_attribute :quantity
      add_attribute :run_credit_applicable
      add_attribute :run_id
      add_attribute :total

      has_one :credit
      has_one :invoice
      has_one :organization
      has_one :payment_method
      has_one :project
      has_one :run

      filter :subdomain, apply: lambda { |records, value, _options|
        organization = Organization.find_by(subdomain: value[0])
        records.where(organization_id: organization.id)
      }

      filter :invoice_id, apply: lambda { |records, value, _options|

        # To filter nil a truthy filter must be specified, otherwise no filter will be applied.
        if value[0] == 'none'
          records.where(invoice_id: nil)
        elsif value[0]
          records.where(invoice_id: value[0])
        else
          records
        end
      }
    end
  end
end
