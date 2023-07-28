class SlackMessageForQCRunJob
  include Sidekiq::Worker
  include Rails.application.routes.url_helpers

  USERNAME   = 'QCRunBot'
  CHANNEL    = '#qc'
  ICON_EMOJI = ':white_check_mark:'

  def message(subject, url)
    {
      fallback: subject,
      fields: [
        { title: "Message", value: subject, short: false },
        { title: "URL", value: url, short: false }
      ]
    }
  end

  def perform(run_title, url)
    attached_message = message("The following QC is ready to run: #{run_title}", url)

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      icon_emoji: ICON_EMOJI,
      attachments: [ attached_message ]
    })
  end
end
