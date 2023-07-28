module Api
  module V1
    class InvoicesController < Api::ApiController
      def update
        id = params.require(:id)
        data = params.require(:data).to_unsafe_hash
        if data[:attributes].present? && (data[:attributes][:forgiven_at].present? ||
          data[:attributes][:charged_at].present?)
          invoice = Invoice.find(id)
          invoice.with_lock do
            super
          end
        else
          super
        end
      end
    end
  end
end
