# Sends a slack message for failed picks by the location picking algo
class LocationPickerSlackMessage
  include Sidekiq::Worker

  SLACK_CHANNEL = '#location-picker-logs'

  def compose_success_payload(picker_log)
    {
      username:   'Great Pick!',
      icon_emoji: ":dancers:",
      channel:    SLACK_CHANNEL,
      attachments: [
        {
          fields: [
            { title: 'Suggested Location', value: Location.find(picker_log.suggested_location_id).human_path },
            { title: 'Container Type', value: picker_log.container_type_id },
            { title: 'Container', value: picker_log.container_id || 'None' },
            { title: 'Admin', value: Admin.find(picker_log.admin_id).name },
            { title: 'Log ID', value: picker_log.id }
          ],
          fallback: 'Successful Pick!',
          color: "#36a64f"
        }
      ]
    }
  end

  def compose_failure_payload(picker_log)
    {
      username:   'Bad Pick',
      icon_emoji: ":rotating_light:",
      channel:    SLACK_CHANNEL,
      attachments: [
        {
          fields: [
            { title: 'Reason', value: picker_log.reason },
            { title: 'Container Type', value: picker_log.container_type_id },
            { title: 'Container', value: picker_log.container_id || 'None' },
            { title: 'Suggested Location', value: Location.find(picker_log.suggested_location_id).human_path },
            { title: 'Admin', value: Admin.find(picker_log.admin_id).name },
            { title: 'Log ID', value: picker_log.id }
          ],
          fallback: picker_log.reason,
          color: "#b62525"
        }
      ]
    }
  end

  def perform(picker_log_id)
    picker_log = LocationPickerLog.find(picker_log_id)
    payload    = if picker_log.chosen_location_id.nil?
                   compose_success_payload(picker_log)
                 else
                   compose_failure_payload(picker_log)
                 end

    SLACK_CLIENT.ping(payload)
  end

end
