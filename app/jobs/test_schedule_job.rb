# Kicked off when a run is submitted, to get a running time estimate and check
# schedulability.
class TestScheduleJob
  include Sidekiq::Worker

  NUM_RETRIES = 5
  sidekiq_options(retry: NUM_RETRIES)

  sidekiq_retries_exhausted do |msg|
    raise "Failed to complete test schedule after #{NUM_RETRIES} retries. " \
          "#{msg['class']} with #{msg['args']}: #{msg['error_message']}"
  end

  # Compute the duration of a Schedule
  # @param schedule A Schedule returned by RabbitInterface
  # @return Duration in seconds
  def self.schedule_duration(schedule)
    schedule[:metadata][:makespan] / 1000
  end

  def perform(run_id)
    run = Run.find(run_id)

    if !run.is_open
      # Closed runs may no longer have containers, so producing tiso reservations isnt possible.
      return
    end

    device_set = TCLE_SERVICE.universal_device_set

    if device_set.nil?
      Rails.logger.info("[TCLE] Device Set response was empty for run '#{run_id}'")
      return
    end

    # fake-reserve some tiso slots
    reservations = ReservationManager.fake_reservations(run.refs, run.instructions, device_set)
    # convert to workcell json
    run_json = run.to_workcell_json(reservations, fake_provision_sources: true)

    res = TCLE_SERVICE.compile_and_schedule(device_set, run_json)

    if res.nil?
      Rails.logger.info("[TCLE] Schedule response was empty for run '#{run_id}'")
      return
    end

    # Swallow schedule failures. Successfully scheduled runs will have an
    # 'Est. Runtime' on the admin dashboard in the webapp:
    # https://secure.transcriptic.com/admin
    if !res[:stackTrace].nil?
      Rails.logger.info("[TCLE] Failed to schedule run '#{run_id}'")
      return
    end

    run.estimated_run_time_cache = TestScheduleJob.schedule_duration(res)
    run.save
  end
end
