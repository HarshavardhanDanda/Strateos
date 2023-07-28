class ClearOldInternalRunsJob
  include Sidekiq::Worker

  def perform
    older_than = Time.now - 1.month

    # Find all INTERNAL runs that aren't completed, canceled, or aborted
    old_runs = Run.where(internal_run: true)
                  .where("created_at < ?", older_than)
                  .where.not("status = 'complete' OR status = 'aborted' OR status = 'canceled'")

    # For runs in progress we abort, for all else we cancel.
    old_runs.each do |run|
      # check that instructions haven't completed recently
      next if Instruction.where(run_id: run.id)
                         .where("completed_at > ?", older_than)
                         .exists?

      if run.status == 'in_progress'
        run.abort_and_cleanup("Old internal run")
      else
        run.cancel_and_cleanup("Old internal run")
      end
    end
  end
end
