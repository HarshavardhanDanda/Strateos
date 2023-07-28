class SlackMessageForReturnShipmentJob
  include Sidekiq::Worker
  include Rails.application.routes.url_helpers

  CHANNEL  = '#workcell-operators'
  USERNAME = 'ReturnShipmentBot'

  def message(operated_by_subdomain)
    url = "#{root_url}#{operated_by_subdomain}/lab_shipments/return"
    {
      fallback: "New return shipment has been requested",
      pretext:  "New return shipment has been requested. View return requests "\
                " <#{url}|here>.",
      fields: [ { title: "URL", value: url, short: false } ]
    }
  end

  def perform(operated_by_subdomain)
    message = message(operated_by_subdomain)

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      attachments: [ message ]
    })
  end
end
