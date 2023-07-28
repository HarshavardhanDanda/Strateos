class InvoicesController < UserBaseController

  def index
    organization =  if params[:org_id]
                      authorize(current_user, :can_view_global_invoices?)
                      Organization.find(params[:org_id])
                    else
                      authorize(@organization, :admin?)
                      @organization
                    end
    render json: organization.invoices
  end

  def show
    unless Feature.enabled? :netsuite
      raise(ActionController::RoutingError.new('Not Found'), 'NetSuite Feature not enabled')
    end

    authorize(@organization, :admin?)
    invoice = @organization.invoices.find(params.require(:id))

    if invoice.xero_invoice_guid.blank? and invoice.netsuite_invoice_id.blank?
      raise(ActiveRecord::NotFound.new, 'Invoice blank')
    end

    respond_to do |format|
      format.pdf do
        if invoice.xero_invoice_guid.present?
          s3_response =
            S3Helper.instance.client.get_object(bucket: S3_UPLOAD_BUCKET, key: "inv-#{invoice.xero_invoice_number}.pdf")
          file_data = s3_response.body.read
          file_name = invoice.xero_invoice_number
        else
          begin
            file_data = $netsuite_script.get(invoice.netsuite_invoice_id)
            file_name = invoice.netsuite_invoice_id
          rescue Timeout::Error => e
            Rails.logger.error "Error occured while downloading netsuite invoice #{invoice.netsuite_invoice_id}"\
                               ": #{e.message}"
            render template: "errors/500", status: 500, content_type: "text/html" and return
          end
        end

        send_data(file_data, type: 'application/pdf',
                  filename: "Transcriptic Invoice #{file_name}.pdf")
      end
    end
  end

  def apply_credit
    invoice = Invoice.find(params.require(:id))
    credit  = Credit.find(params.require(:credit_id))

    authorize(invoice, :can_manage_global_invoices?)
    error = invoice.apply_credit(credit)

    if error
      return render json: { error: error }, status: :unprocessable_entity
    end

    invoice.reload
    credit.reload

    render json: {
      credit: credit.as_json,
      invoice: invoice.as_json(Invoice.full_json)
    }
  end
end
