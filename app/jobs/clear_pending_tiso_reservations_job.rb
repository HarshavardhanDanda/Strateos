class ClearPendingTisoReservationsJob
  include Sidekiq::Worker

  # Clear any reservations in the case that we have straggler tiso reservations.
  # This could happen if TCLE has rabbit issues and we do not receive updates when RunExecutions
  # have been canceled/completed.
  def perform(run_id)
    ReservationManager.complete_run(run_id)
  end
end
