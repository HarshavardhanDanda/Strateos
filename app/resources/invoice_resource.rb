require 'base_resource'

module Api
  module V1
    class InvoiceResource < Api::BaseResource
      add_attribute :charged_at
      add_attribute :created_at
      add_attribute :declined_at
      add_attribute :forgiven_at
      add_attribute :issued_at
      add_attribute :month
      add_attribute :organization_id
      add_attribute :payment_method_id
      add_attribute :reference
      add_attribute :remitted_at
      add_attribute :updated_at
      add_attribute :xero_invoice_guid
      add_attribute :netsuite_invoice_id
      add_attribute :xero_invoice_number
      add_attribute :xero_tax_type
      add_attribute :xero_total
      add_attribute :xero_total_tax
      add_attribute :total
      add_attribute :contact_user

      has_many :invoice_items
      has_one :organization
      has_one :payment_method

      filter :remitted, apply: lambda { |records, values, _options|
        return values[0].to_s.downcase == "true" ? records.where.not(remitted_at: nil) : records.where(remitted_at: nil)
      }
      filter :forgiven, apply: lambda { |records, values, _options|
        return values[0].to_s.downcase == "true" ? records.where.not(forgiven_at: nil) : records.where(forgiven_at: nil)
      }
      filter :charged, apply: lambda { |records, values, _options|
        return values[0].to_s.downcase == "true" ? records.where.not(charged_at: nil) : records.where(charged_at: nil)
      }
      filter :test_org, apply: lambda { |records, values, _options|
        return records.joins(:organization)
                      .where(organizations: { test_account: values[0].to_s.downcase == "true" })
      }

      filter :finalized, apply: lambda { |records, values, _options|
        if values[0].to_s.downcase == "true"
          records.where.not(netsuite_invoice_id: nil).or(records.where.not(xero_invoice_guid: nil))
                 .joins(:invoice_items)
        else
          records.where(netsuite_invoice_id: nil, xero_invoice_guid: nil).joins(:invoice_items)
        end
      }
      filter :delay_period, apply: lambda { |records, values, _options|
        records.where("charged_at - invoices.created_at > interval '#{values[0]} days'")
      }
      filter :organization_id
      filter :month
      filter :payment_method_id

      def contact_user
        {
          email: @model.contact_user.email,
          name: @model.contact_user.name
        }
      end

      def self.creatable_fields(_context)
        [ :payment_method_id, :organization_id, :reference, :month ]
      end

      def self.updatable_fields(_context)
        [ :forgiven_at, :remitted_at, :charged_at ]
      end
    end
  end
end
