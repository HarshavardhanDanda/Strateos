class ExecuteWebhookJob
  include Sidekiq::Worker

  # 7 Retries gives the service roughly an hour to come back up and handle the hook
  # (see https://github.com/mperham/sidekiq/wiki/Error-Handling)
  NUM_RETRIES = 7
  sidekiq_options(retry: NUM_RETRIES)

  sidekiq_retries_exhausted do |msg|
    # TODO: Replace this with a user notification once https://work.r23s.net/T8046 is complete
    raise "Failed to execute webhook, after #{NUM_RETRIES} retries. " \
          "#{msg['class']} with #{msg['args']}: #{msg['error_message']}"
  end

  def perform(run_id, event)
    run = Run.find(run_id)

    webhook_url = run.project.webhook_url

    return if webhook_url.blank?

    post_data = {
      run: run.as_json({
        only: [ :id, :title ],
        include: [],
        methods: []
      }),
      project: run.project.as_json({
        only: [ :id, :name ],
        include: [],
        methods: []
      }),
      event: event
    }

    # Raise SidekiqRetriableErorrs if we have any problems making the webhook call. These errors are ignored by
    # new relic, to prevent false alarms. We will still be notified after all retries, so we can be aware of the
    # issue. That should only be removed once we have user notifications for failed web hooks
    begin
      response = Excon.post(webhook_url, body: post_data.to_json, headers: { 'Content-Type' => 'application/json' })

      if response.status >= 400
        error_msg = "Bad webhook response code=#{response.status} for run=#{run.id} url=#{webhook_url}"
        raise SidekiqRetriableError.new(error_msg)
      end
    rescue => e
      error_msg = "Error making webhook call for run=#{run.id} url=#{webhook_url}. #{e}"
      raise SidekiqRetriableError.new(error_msg)
    end
  end
end
