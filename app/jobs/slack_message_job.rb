class SlackMessageJob
  include Sidekiq::Worker

  def perform(payload)
    SLACK_CLIENT.ping(payload)
  end
end
