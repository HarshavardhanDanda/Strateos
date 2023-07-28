class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token

  def easypost
    data = params.require(:result)
    shipment_id = data.require(:shipment_id)

    if (intake_kit = IntakeKit.find_by(easy_post_shipment_id: shipment_id))
      last_update = data.require(:tracking_details).last
      intake_kit.update(
        status: last_update[:status],
        status_message: last_update[:message],
        status_update_time: last_update[:datetime],
        est_delivery_date: data[:est_delivery_date],
        carrier: data[:carrier],
        tracking_number: data[:tracking_code],
        received_at: last_update[:status] == 'delivered' ? last_update[:datetime] : nil
      )
    elsif (return_shipment = ReturnShipment.find_by(ep_shipment_id: shipment_id))
      last_update = data.require(:tracking_details).last
      return_shipment.update(
        tracking_message: last_update[:message],
        delivery_date: data[:est_delivery_date],
        carrier: data[:carrier],
        tracking_number: data[:tracking_code]
      )
    else
      raise ActiveRecord::RecordNotFound
    end

    head :ok

  end
end
