class DiscardContainersOnRunCompletionJob
  include Sidekiq::Worker
  # At the completion of a run deletes all of the run's discard containers.
  #
  # Typically, this job will only be necessary if instructions
  # are completed by humans or if an updateWarps message is
  # not received informing the webapp to delete the container.
  def perform(run_id)
    run = Run.select(:completed_at).find_by(id: run_id)
    return unless run.completed_at

    # destroy all containers not yet destroyed.
    Container.joins(:refs)
             .where(refs: { run_id: run_id })
             .where("(refs.destiny->'discard')::text = 'true'")
             .each(&:destroy)
  end

end
