# Sends a slack message for failed auto provisions
class AutoProvisionSlackMessage
  include Sidekiq::Worker

  USERNAME   = 'Bad Pick'
  ICON_EMOJI = ":rotating_light:"
  CHANNEL    = '#auto-provision-logs'

  def message(reason, provision_spec_id, instruction_id)
    {
      fields: [
        { title: 'Reason',            value: reason },
        { title: 'Provision Spec ID', value: provision_spec_id },
        { title: 'Instruction ID',    value: instruction_id }
      ],
      fallback: reason,
      color: "#b62525"
    }
  end

  def perform(reason, provision_spec_id, instruction_id)
    message = message(reason, provision_spec_id, instruction_id)

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      icon_emoji: ICON_EMOJI,
      attachments: [ message ]
    })
  end
end
