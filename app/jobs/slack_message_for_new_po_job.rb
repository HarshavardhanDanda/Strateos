class SlackMessageForNewPoJob
  include Sidekiq::Worker
  include Rails.application.routes.url_helpers

  USERNAME   = 'PurchaseOrderBot'
  CHANNEL    = '#purchase-orders'
  ICON_EMOJI = ':moneybag:'

  def message(subject)
    url = Rails.application.routes.url_helpers.admin_billing_index_url
    {
      fallback: subject,
      fields: [
        { title: "Message", value: subject, short: false },
        { title: "URL", value: url, short: false }
      ]
    }
  end

  def perform(organization_name)
    message = message("PO awaiting approval from organization #{organization_name}")

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      icon_emoji: ICON_EMOJI,
      attachments: [ message ]
    })
  end
end
