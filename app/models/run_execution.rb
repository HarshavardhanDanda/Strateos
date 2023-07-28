class RunExecution < ApplicationRecord
  belongs_to :run
  belongs_to :submitted_by, class_name: "Admin"

  validates :run_id, presence: true
  validates :instruction_ids, presence: true
  validates :workcell_id, presence: true

  scope :active, -> { where(completed_at: nil, cleared_at: nil) }

  scope :active_by_run, lambda { |run_id|
    active.where(run_id: run_id)
  }

  scope :active_by_workcell, lambda { |workcell_id|
    active.where(workcell_id: workcell_id)
  }

  # Convert from tcle runId to split parts
  # Tcle id is in form "#{runId}-#{executionId}"
  def self.extract_id_parts(tcle_run_id)
    return nil if tcle_run_id.nil?

    tcle_id, execution_id = tcle_run_id.split('-')

    [ tcle_id, execution_id ]
  end

  def self.extract_run_id(tcle_run_id)
    return nil if tcle_run_id.nil?
    RunExecution.extract_id_parts(tcle_run_id)[0]
  end

  def self.extract_execution_id(tcle_run_id)
    return nil if tcle_run_id.nil?
    RunExecution.extract_id_parts(tcle_run_id)[1]
  end

  def tcle_id
    "#{self.run_id}-#{self.id}"
  end

  def instructions
    # Instruction ids are stored as an array in the DB so can't do
    # a releation here or a `has_many`.
    Instruction.where(id: instruction_ids)
  end

  def completed?
    !self.completed_at.nil?
  end

  def should_complete?
    # Check if all instructions have completed
    self.instructions.where(completed_at: nil).empty?
  end

  def complete!(now = Time.now)
    self.completed_at = now
    self.save!
  end

  def complete(now = Time.now)
    self.completed_at = now
    self.save
  end
end
