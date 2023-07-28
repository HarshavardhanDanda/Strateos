require 'base_resource'

module Api
  module V1
    class PaymentMethodResource < Api::BaseResource
      add_attribute :address_id
      add_attribute :alias
      add_attribute :created_at
      add_attribute :credit_card_last_4
      add_attribute :credit_card_name
      add_attribute :credit_card_type
      add_attribute :credit_card_zipcode
      add_attribute :deleted_at
      add_attribute :expiry
      add_attribute :organization_id
      add_attribute :po_approved_at
      add_attribute :po_attachment_url
      add_attribute :po_invoice_address
      add_attribute :po_limit
      add_attribute :po_reference_number
      add_attribute :stripe_card_id
      add_attribute :updated_at
      add_attribute :description
      add_attribute :payment_type
      # type is reserved keyword
      # need to handle polymorphic resources better.
      #   add_attribute :type

      has_many :invoice_items
      has_many :projects
      has_one :org_for_which_i_am_default
      has_one :organization
      has_one :address

      # Add model hints to support polymorphic datatypes
      model_hint model: CreditCard, resource: :payment_method
      model_hint model: PurchaseOrder, resource: :payment_method

      filter :type

      filter :approved, apply: lambda { |records, values, _options|
        if values[0].to_s.downcase == "false"
          return records.where(po_approved_at: nil)
        else
          return records.where.not(po_approved_at: nil)
        end
      }

      def payment_type
        @model.type
      end

      def self.updatable_fields(_context)
        [ :po_approved_at ]
      end

    end
  end
end
