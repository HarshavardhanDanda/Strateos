require 'prawn/labels'

Prawn::Labels.types = {
  Avery5160Adjusted: {
    paper_size: 'LETTER',
    top_margin: 40,
    bottom_margin: 40,
    left_margin: 19,
    right_margin: 19,
    columns: 3,
    rows: 10,
    column_gutter: 15,
    row_gutter: 0
  }.with_indifferent_access
}

module Api
  module V1
    module Actions
      class InvoiceActionsController < UserBaseController
        def generate_po_labels
          authorize(current_user, :can_view_global_invoices?)
          month = params.require(:month)

          addresses = Address.joins(purchase_orders: { organization: :invoices })
                             .where(organizations: { test_account: false }, invoices: { charged_at: nil, month: month })
                             .includes(:organization)
                             .distinct
                             .map(&:label_text)

          labels = Prawn::Labels.render(addresses, type: :Avery5160Adjusted, shrink_to_fit: true) do |pdf, name|
            pdf.text name
          end

          send_data labels, :filename => "PO Address Labels.pdf", :type => "application/pdf"
        end

        def xero_reconcile
          authorize(current_user, :can_view_global_invoices?)
          data_str = params.require(:date)
          date     = Date.parse(data_str)

          where_clause = "(Status==\"PAID\" || Status==\"AUTHORISED\") && "\
                         "Date>=DateTime.Parse(\"#{date}\") && "\
                         "Date<=DateTime.Parse(\"#{date.end_of_month}\") && "\
                         "Type=\"ACCREC\""

          xero_invoices = $xero.Invoice.all(where: where_clause)

          invoices = Hash[xero_invoices.map do |invoice|
            invoice_attr = invoice.attributes
            [
              invoice_attr[:invoice_number],
              {
                invoice_number: invoice_attr[:invoice_number],
                xero_date: invoice_attr[:date],
                xero_total: invoice_attr[:total]
              }
            ]
          end]

          local = Invoice.where(
            "(charged_at between ? and ?) or (xero_invoice_number in (?))",
            date,
            date.end_of_month,
            invoices.values.map { |i| i[:invoice_number] }
          )

          local.map do |invoice|
            invoices[invoice.xero_invoice_number] =
              if invoices.key?(invoice.xero_invoice_number)
                invoices[invoice.xero_invoice_number].merge({
                  id: invoice.id,
                  local_id: invoice.id,
                  organization: invoice.organization.name,
                  invoice_number: invoice.xero_invoice_number,
                  created_at: invoice.created_at,
                  charged_at: invoice.charged_at,
                  local_total: invoice.total
                })
              else
                {
                  id: invoice.id,
                  local_id: invoice.id,
                  organization: invoice.organization.name,
                  invoice_number: invoice.xero_invoice_number,
                  charged_at: invoice.charged_at,
                  created_at: invoice.created_at,
                  local_total: invoice.total
                }
              end
          end

          render json: {
            xero: xero_invoices.map do |invoice|
              invoice_attr = invoice.attributes
              if invoice_attr[:contact]
                invoice_attr[:contact] = invoice_attr[:contact].attributes
              end

              if invoice_attr[:payments]
                invoice_attr[:payments] = invoice_attr[:payments].map(&:attributes)
              end
              invoice_attr
            end,
            local: local.as_json(Invoice.short_json),
            merged: invoices
          }
        end

        def generate_netsuite_invoice
          authorize(Invoice, :generate_netsuite_invoice?)
          invoice = Invoice.find(params.require(:id))
          now_month = Time.now.strftime("%Y-%m")

          if invoice.netsuite_invoice_id.present?
            invoice.errors.add(:netsuite_invoice_id, :already_in_netsuite, value: invoice.netsuite_invoice_id)
            raise ActiveRecord::RecordInvalid.new(invoice)
          end

          if now_month < invoice.month
            invoice.errors.add(:netsuite_invoice_id, :invalid_netsuite_month, netsuite_month: now_month,
                               invoice_month: invoice.month)
            raise ActiveRecord::RecordInvalid.new(invoice)
          end

          unless Feature.enabled?(:netsuite)
            raise NetSuite::NetSuiteAccessError.new("NetSuite feature is not enabled.")
          end

          invoice.send_to_invoice_provider

          if invoice.total == 0
            invoice.remit
          end

          invoice.save!
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::InvoiceResource)
          resource = Api::V1::InvoiceResource.new(invoice, context)
          json = serializer.serialize_to_hash(resource)
          render json: json, status: :ok
        end
      end
    end
  end
end
