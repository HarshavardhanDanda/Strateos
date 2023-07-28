module Api
  module V1
    class InvoiceItemsController < Api::ApiController

      CREATE_SCHEMA = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
              "type": {
                "type": "string"
              },
              "attributes": {
                "type": "object",
                "properties": {
                  "charge": {
                    "type": "number"
                  },
                  "credit_id": {
                    "type": "string, null"
                  },
                  "description": {
                    "type": "string"
                  },
                  "invoice_id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "quantity": {
                    "type": "integer"
                  },
                  "run_credit_applicable": {
                    "type": "boolean"
                  },
                  "netsuite_item_id": {
                    "type": "integer"
                  },
                  "autocredit": {
                    "type": "boolean"
                  },
                  "run_id": {
                    "type": "string, null"
                  }
                },
                "required": [
                  "charge",
                  "quantity",
                  "name",
                  "invoice_id",
                  "netsuite_item_id",
                  "run_credit_applicable"
                ]
              }
            },
            "required": [
              "type",
              "attributes"
            ]
      }

      def create
        authorize(InvoiceItem, :create?)
        data = params.require(:data).to_unsafe_h
        validate_json(CREATE_SCHEMA, data)
        attributes = data[:attributes]

        invoice_id            = attributes[:invoice_id]
        name                  = attributes[:name]
        description           = attributes[:description]
        charge                = attributes[:charge].to_f
        quantity              = [ attributes[:quantity].to_i, 1 ].max
        run_credit_applicable = attributes[:run_credit_applicable]
        netsuite_item_id      = attributes[:netsuite_item_id].to_i
        autocredit            = attributes[:autocredit]
        credit_id             = attributes[:credit_id]
        run_id                = attributes[:run_id]

        invoice = Invoice.find(invoice_id)
        payment_method = PaymentMethod.find(invoice.payment_method_id)
        org = payment_method.organization
        run = run_id.nil? ? nil : Run.find(run_id)

        invoice_item = InvoiceItem.new(
          name: name,
          charge: charge,
          quantity: quantity,
          netsuite_item_id: netsuite_item_id,
          description: (description || name),
          run_credit_applicable: run_credit_applicable,
          invoice_id: invoice.id,
          organization_id: org.id,
          payment_method_id: payment_method.id,
          run_id: run&.id
        )

        if autocredit && !credit_id.nil?
          invoice_item.errors.add(:credit_id, :invalid_autocredit)
          raise ActiveRecord::RecordInvalid.new(invoice_item)
        end

        credit_items = generate_credit_invoice_items(invoice_item, autocredit: autocredit, credit_id: credit_id)
        invoice_items = credit_items + [ invoice_item ]

        InvoiceManager.can_add_charges(invoice_items)
        InvoiceItem.transaction do
          invoice_items.each(&:save!)
        end

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::InvoiceItemResource)
        resource = invoice_items.map { |item| Api::V1::InvoiceItemResource.new(item, context) }
        json = serializer.serialize_to_hash(resource)
        render json: json, status: :created
      end

      private

      def generate_credit_invoice_items(invoice_item, credit_id: nil, autocredit: nil)
        if autocredit
          InvoiceManager.auto_apply_credits(invoice_item)
        elsif credit_id.present?
          credit = Credit.find(credit_id)
          if credit.expires_at.present? and credit.expires_at < (invoice_item.created_at || Time.now)
            invoice_item.errors.add(:credit_id, :expired, value: credit_id)
            raise ActiveRecord::RecordInvalid.new(invoice_item)
          elsif credit.credit_type == 'Runs' && !invoice_item.run_credit_applicable
            invoice_item.errors.add(:credit_id, :not_applicable, value: credit_id)
            raise ActiveRecord::RecordInvalid.new(invoice_item)
          else
            InvoiceManager.apply_credits(invoice_item, [ credit ])
          end
        else
          []
        end
      end
    end
  end
end
