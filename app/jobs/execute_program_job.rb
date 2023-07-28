class ExecuteProgramJob
  include Sidekiq::Worker
  sidekiq_options queue: "critical"

  sidekiq_options :retry => 3

  def perform(program_execution_id)
    execution = ProgramExecution.find(program_execution_id)
    run = execution.run
    instruction = execution.instruction

    # check all deps are met
    if !run.nil? && !run.fully_complete?
      logger.info("[ExecuteProgramJob] Returning early because run isn't complete")
      logger.info("[ExecuteProgramJob] has_generated_all_data: #{run.has_generated_all_data}")
      logger.info("[ExecuteProgramJob] complete?: #{run.complete?}")
      raise ProgramExecutionException.new("Run not ready for program_execution '#{execution.id}'")
    elsif !instruction.nil? && !instruction.fully_complete?
      logger.info("[ExecuteProgramJob] Returning early because inst isnt complete")
      raise ProgramExecutionException.new("Instruction not ready for program_execution '#{execution.id}'")
    end

    # Inside the lock set a started_at flag
    # so that no other process can try to envoke this execution again
    execution.with_lock do
      # check flag
      if !execution.started_at.nil?
        logger.info("[ExecuteProgramJob] Returning early because started_at isn't nil")
        return
      end

      # set flag so later envocations can check it
      execution.update(started_at: Time.now)
    end
    # Now that the flag is set we can execute confidently
    execution.execute!
  end
end
