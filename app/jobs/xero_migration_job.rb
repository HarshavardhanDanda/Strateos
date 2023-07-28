class XeroMigrationJob
  include Sidekiq::Worker

  sidekiq_options(retry: 3)
  LOG_PREFIX = "[XERO_MIGRATION]"

  def perform(invoice_id)

    if !Rails.env.production? and !Feature.enabled? :xero
      return
    end

    invoice = Invoice.find(invoice_id)

    begin
      retry_count ||= 0

      response = $xero.Invoice.find(invoice.xero_invoice_guid)

      if response.empty?
        error_msg = "Bad XERO pdf response for invoice=#{invoice_id}"
        raise SidekiqRetriableError.new(error_msg)
      end
    rescue StandardError
      retry_count += 1

      if retry_count < 3
        sleep 10
        Rails.logger.info("#{LOG_PREFIX} PDF download from XERO failed for invoice id "\
                          "#{invoice_id}, Re-attempt #{retry_count}")
        retry
      else
        raise
      end
    end

    S3Helper.instance.client.put_object(
      bucket: S3_UPLOAD_BUCKET,
      key: "inv-#{invoice_id}.pdf",
      content_type: "application/pdf",
      body: response
    )
    Rails.logger.info("#{LOG_PREFIX} Uploaded invoice id '#{invoice_id}' to S3 with key 'inv-#{invoice_id}.pdf'")
  end
end
