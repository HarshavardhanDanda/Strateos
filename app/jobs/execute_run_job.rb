class ExecuteRunJob
  include Sidekiq::Worker

  def perform(run_id)
    # instructions in sequence order.
    instructions = Instruction.where(run_id: run_id, completed_at: nil)
                              .order(:sequence_no)

    instructions.each do |inst|
      run = Run.find_by_id(run_id)
      if run.nil? or run.closed?
        next
      end

      # Currently we don't care to record the user that completed the test run
      # and also want to avoid the need for polymorphic types.
      completed_by_admin_id = nil

      inst.manual_complete(true, completed_by_admin_id)
    end
  end

end
