# A request for TCLE to kick off a scheduling job
class ScheduleRequest < ApplicationRecord
  SCHEDULE_DELAY = 10.seconds

  STATUS_ABORTED = "aborted"
  STATUS_NEW = "new"
  STATUS_PROCESSING = "processing"

  belongs_to :run

  # We need a workcell to route the schedule request to.
  validates :workcell_id, presence: true

  def create_schedule_job(delay = SCHEDULE_DELAY, service_url=nil)
    ScheduleJob.perform_in(delay, self.id, service_url)
  end

  def abort!
    run_ex_id = RunExecution.extract_execution_id(self.request["run"]["run_id"])

    ReservationManager.clear_run_execution(run_ex_id)
    update!(status: STATUS_ABORTED)
  end

  def aborted?
    status == STATUS_ABORTED
  end

  def processing?
    status == STATUS_PROCESSING
  end

  def is_test
    !!request["isTest"]
  end

  def status_query_path
    "/#{self.run.organization.subdomain}/#{self.run.project_id}/runs/#{self.run.id}/schedule_requests/#{self.id}"
  end

  def self.response_json
    {
      only: [
        :id, :workcell_id, :request, :status, :result, :run_id, :created_at, :updated_at
      ],
      methods: [ :status_query_path ]
    }
  end

end
