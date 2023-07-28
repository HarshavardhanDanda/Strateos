module WebHookService
  # rubocop:disable ModuleFunction
  extend self

  def instruction_completed(instruction)
    instruction_json = instruction.as_json({
      only: [ :id, :sequence_no, :completed_at ],
      methods: [],
      include: {}
    })

    execute_webhook("instruction_completed", instruction.run_id, instruction_json)
  end

  def run_completed(run)
    execute_webhook("run_completed", run.id)
  end

  def run_started(run)
    execute_webhook("run_started", run.id)
  end

  private

  # TODO: We will refactor this in the future when there are hooks
  # that are not run centric, but the ExecuteWebhookJob is currently
  # written that way
  def execute_webhook(op_name, run_id, event_data = {})
    event_data[:op] = op_name
    ExecuteWebhookJob.perform_async(run_id, event_data)
  end
end
