# Periodically slurp up some aggregate analytics and post to Slack
class RecurringAnalyticsJob
  include Sidekiq::Worker

  # Get today's and last 30 day's worth of data and display it
  def self.compose_slack_payload
    num_days_rolling = 30
    num_days_rolling_f = num_days_rolling.to_f # Coerce to float to force decimal precision in division below

    count_data_created_today   = Dataset.created_last_Ndays(1).count
    count_runs_completed_today = Run.completed_last_Ndays(1).count
    count_warp_completed_today = Warp.completed_last_Ndays(1).count

    avg_data_created_per_day   = Dataset.created_last_Ndays(num_days_rolling).count / num_days_rolling_f
    avg_runs_completed_per_day = Run.completed_last_Ndays(num_days_rolling).count / num_days_rolling_f
    avg_warp_completed_per_day = Warp.completed_last_Ndays(num_days_rolling).count / num_days_rolling_f

    data_created_text =
      if avg_data_created_per_day > 0
        percent_data_completed = (count_data_created_today / avg_data_created_per_day) * 100
        "#{count_data_created_today}  (#{percent_data_completed.to_i}% of #{num_days_rolling} day avg)"
      else
        count_data_created_today
      end

    runs_completed_text =
      if avg_runs_completed_per_day > 0
        percent_runs_completed = (count_runs_completed_today / avg_runs_completed_per_day) * 100
        "#{count_runs_completed_today}  (#{percent_runs_completed.to_i}% of #{num_days_rolling} day avg)"
      else
        count_runs_completed_today
      end

    warps_completed_text =
      if avg_warp_completed_per_day > 0
        percent_warp_completed = (count_warp_completed_today / avg_warp_completed_per_day) * 100
        "#{count_warp_completed_today}  (#{percent_warp_completed.to_i}% of #{num_days_rolling} day avg)"
      else
        count_warp_completed_today
      end

    {
      channel: "#random",
      username: "Daily Strateos Stats",
      icon_emoji: ":strateos:",
      attachments: [
        fields: [
          {
            title: "Datasets Created",
            value: data_created_text
          },
          {
            title: "Runs Completed",
            value: runs_completed_text
          },
          {
            title: "Warps Completed",
            value: warps_completed_text
          }
        ]
      ]
    }
  end

  def perform
    SLACK_CLIENT.ping(RecurringAnalyticsJob.compose_slack_payload)
  end
end
