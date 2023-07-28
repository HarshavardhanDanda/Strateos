class RunNotReadyForProgram < StandardError
end

class InstructionNotReadyForProgram < StandardError
end

class ProgramExecutionMissingStartTime < StandardError
end

class ProgramExecution < ApplicationRecord
  has_snowflake_id('prgp')
  belongs_to :program
  belongs_to :run
  belongs_to :instruction
  belongs_to :user
  belongs_to :organization

  validate :validate_run_xor_instruction
  validates_presence_of :program
  validates_presence_of :user

  def started?
    started_at?
  end

  def execute!
    if !run.nil? && !run.fully_complete?
      raise RunNotReadyForProgram
    elsif !instruction.nil? && !instruction.fully_complete?
      raise InstructionNotReadyForProgram
    end

    # The caller must set this
    if self.started_at.nil?
      raise ProgramExecutionMissingStartTime
    end

    pre_execute_hook
    res =
      if Rails.env.production? || Rails.env.staging?
        IgorService.execute_program(self)
      else
        "test response"
      end

    self.update(response: res, completed_at: Time.now)
    post_execute_hook
  end

  def pre_execute_hook
    SlackMessageForProgramLifecycleJob.perform_async('program_execution_start', self.id)
  end

  def post_execute_hook
    SlackMessageForProgramLifecycleJob.perform_async('program_execution_complete', self.id)
  end

  def can_be_seen_by?(user)
    user.member_of_org?(organization)
  end

  def validate_run_xor_instruction
    if !(run_id.nil? ^ instruction_id.nil?)
      errors.add(:base, 'Must provide a run id or instruction id, not both')
    end
  end
end
