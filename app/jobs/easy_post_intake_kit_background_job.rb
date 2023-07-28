class EasyPostIntakeKitBackgroundJob
  include Sidekiq::Worker

  def perform(intake_kit_id)
    intake_kit = IntakeKit.find(intake_kit_id)
    address    = intake_kit.address
    lab_address = intake_kit.lab.address

    begin
      shipment = EasyPostService.create_and_purchase_intake_kit_shipment(intake_kit, address, lab_address)
      intake_kit.easy_post_shipment_id = shipment.id
      intake_kit.easy_post_label_url   = shipment.postage_label.label_url
      intake_kit.tracking_number       = shipment.tracking_code
      if !shipment.forms.empty?
        intake_kit.commercial_invoice_url = shipment.forms[0].form_url
      end
      intake_kit.save!
    rescue EasyPost::Error => e
      Bugsnag.notify("EasyPost Error: #{e.message}")

      # Re-raise the exception so we can use sidekiq's default backoff/retry
      raise e
    end

  end
end
