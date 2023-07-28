class LocationPickerSummaryJob
  include Sidekiq::Worker

  SLACK_CHANNEL = '#location-picker-logs'

  def percent(number)
    "#{number}%"
  end

  def compose_payload(past_day_stats, past_month_stats)
    {
      username:   'Daily Summary',
      icon_emoji: ":bulb:",
      channel:    SLACK_CHANNEL,
      attachments: [
        {
          fields: [
            { title: 'Success', value: past_day_stats[:success] },
            { title: 'Failure', value: past_day_stats[:failure] },
            { title: 'Success Rate', value: percent(past_day_stats[:success_rate]) },
            { title: 'Past Month', value: percent(past_month_stats[:success_rate]) }
          ],
          fallback: "Daily Summary",
          color: "#42cef4"
        }
      ]
    }
  end

  def stats_to_date(start)
    logs = LocationPickerLog.where('created_at >= ?', start)
    total = logs.count
    failure = logs.where("chosen_location_id IS NOT NULL AND chosen_location_id != suggested_location_id").count.to_f
    success = total - failure
    success_rate = (success / total * 100).round(2)

    {
      success: success,
      failure: failure,
      success_rate: total != 0 ? success_rate : 100.0
    }
  end

  def perform
    past_day_stats = stats_to_date(1.day.ago)
    past_month_stats = stats_to_date(1.month.ago)
    payload = compose_payload(past_day_stats, past_month_stats)

    SLACK_CLIENT.ping(payload)
  end

end
