class SlackMessageForIntakeKitJob
  include Sidekiq::Worker
  include Rails.application.routes.url_helpers

  CHANNEL  = '#workcell-operators'
  USERNAME = 'IntakeKitOrderBot'

  def message(intake_kit)
    url = "#{intake_kit.lab.operated_by.subdomain}/lab_shipments/intake_kits"
    {
      fallback: "New intake kit order has been placed",
      pretext:  "New intake kit order has been placed. View intake kit orders"\
                " <#{url}|here>.",
      fields: [ { title: "URL", value: url, short: false } ]
    }
  end

  def perform(intake_kit_id)
    intake_kit = IntakeKit.find(intake_kit_id)
    message = message(intake_kit)

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      attachments: [ message ]
    })
  end
end
