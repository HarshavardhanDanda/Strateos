class Instruction < ApplicationRecord
  has_snowflake_id('i')

  belongs_to :run

  belongs_to :completed_by_admin, class_name: "Admin"

  # because we don't clean up failed warps/instructions, take latest
  has_one :dataset, -> { order 'created_at desc' }, dependent: :destroy

  has_many :warps, -> { order 'completed_at asc' }, dependent: :destroy

  has_many :instructions_refs, class_name: :InstructionRef, dependent: :destroy
  has_many :refs, through: :instructions_refs
  has_many :generated_container_links
  has_many :program_executions
  has_many :generated_containers, through: :generated_container_links, source: :container
  has_many :instruction_steps
  has_many :execution_support_artifact_instructions
  has_many :execution_support_artifacts, through: :execution_support_artifact_instructions

  validates_presence_of :run
  validates_presence_of :sequence_no
  validates_presence_of :operation
  validates_presence_of :op

  after_commit lambda {
    WORKFLOW_RABBIT_SERVICE.publish_instruction_update(instruction: self)
  }

  before_create lambda {
    # op is either cached or persisted as a separate column
    self.generates_execution_support_artifacts =
      "Autoprotocol::#{op.camelcase}".safe_constantize&.generates_esa? || false
  }

  # TODO: add gblocks when supported
  # WHERE op = 'oligosynthesize' OR op ='gblocksynthesize'
  scope :outstanding_synthesis_requests, lambda {
    joins(:run)
      .where(op: 'oligosynthesize')
      .where(started_at: nil)
      .where(runs: { status: 'accepted', test_mode: false, internal_run: false })
      .order(created_at: 'ASC')
  }

  scope :completed, -> { where.not(completed_at: nil) }
  scope :in_progress, -> { where('completed_at is null') }

  scope :with_data_name, -> { where('data_name is not null') }

  def organization
    run.organization
  end

  attr_writer :parsed

  SHORT_JSON = {
    only: [ :id, :sequence_no, :operation, :completed_at, :started_at, :data_name, :run_id,
            :generates_execution_support_artifacts ],
    methods: [],
    include: {
      generated_containers: {
        only: [ :id, :label ]
      },
      warps: {},
      refs: Ref.short_json
    }
  }

  def self.admin_short_json
    json = Instruction::SHORT_JSON.dup
    json[:methods] = [ :is_human_by_default, :completed_by_admin_id, :completed_by_human ]
    json
  end

  def is_human_by_default
    # spinning tubes -> defaults to human
    if op == "spin"
      refs.any? { |ref| ref.try(:container_type).try(:is_tube) }
    else
      human_by_default = [
        'consolidate',
        'distribute',
        'flash_freeze',
        'flow_analyze',
        'gel_separate',
        'gel_purify',
        'illumina_sequence',
        'labchip',
        'maxiprep',
        'miniprep',
        'oligosynthesize',
        'pipette',
        'provision',
        'sanger_sequence',
        'spread',
        'stamp',
        'measure_concentration'
      ]
      human_by_default.include? op
    end
  end

  # Operation is a text feild in postgres because rails is extraordinarily slow
  # at handling json. The appropriate transformation is handled by these set/get
  # methods, and the parsed value is cached.
  #
  # Note that the argument supplied to operation = should be valid json only
  # (no symbol keys).
  def operation=(instruction)
    @operation = instruction
    super(JSON.generate(instruction))
  end

  def operation
    @operation ||= JSON.parse(super)
  end

  def operation_as_executed=(instruction)
    super(JSON.generate(instruction))
  end

  # Operation as executed by the module.
  # This is the actual versus the intended (operation)
  def operation_as_executed
    super.present? ? JSON.parse(super) : nil
  end

  def operation_without_op
    operation.except('op')
  end

  def start
    start!
    true
  rescue ActiveRecord::ActiveRecordError
    false
  end

  def start!
    if run.started_at.nil?
      run.start!
    end

    self.started_at = Time.now
    refs.unrealized.each(&:start)

    self.save!
  end

  def completed?
    self.completed_at.present?
  end

  # Returns true when the instruction has been executed and data generated
  #
  # @return Boolean true if the instruction is completed and data, if relevant, is ready
  def fully_complete?
    if data_name
      if !dataset.nil? && dataset.status == 'converted'
        return completed?
      else
        return false
      end
    else
      return completed?
    end
  end

  def manual_complete(has_completed, completed_by_admin_id)
    if self.started_at.nil?
      self.start
    end

    if has_completed
      self.completed_by_human    = true
      self.completed_by_admin_id = completed_by_admin_id
      complete!(true)
    else
      self.completed_by_human    = false
      self.completed_by_admin_id = nil
      complete!(false)
    end

    # When completing an instruction manually, set any referenced containers
    # to unknown device. This is especially important for situations in
    # which the first few instructions are completed manually, and refer to
    # new containers. The default device_id for new containers is "supply",
    # and if the location doesn't get unset before the rest of the run is
    # passed to the workcell, the workcell will try to retrieve the
    # containers from the "supply" location.
    parsed.refs.each do |ref_name|
      ct = run.refs.find_by_name(ref_name).container
      if ct.device_id == 'supply'
        ct.device_id = nil
        ct.save!
      end
    end
  end

  ###
  # Returns whether or not this instruction needs to be executed by a human.
  #
  # ap_instruction: The autoprotocol Instruction model
  ###
  def requires_manual_execution?(ap_instruction)
    manual_execution_containers = refs.select { |ref| ref.container_type.manual_execution }
    # Exclude specific containers that are loaded/handled manually and can still be automated
    case ap_instruction.op
    when 'dispense'
      # Exclude reagent_sources for dispense
      manual_execution_containers.reject! do |ref|
        ap_instruction.reagent_source.present? && ap_instruction.reagent_source["container"] == ref.name
      end
    when 'liquid_handle'
      if ap_instruction.mode == 'dispense'
        source_containers = ap_instruction.locations.select { |loc| loc[:transports].first[:volume] <= 0.0 }.to_set
        source_containers.map! { |loc| loc[:location][:container] }
        manual_execution_containers.reject! { |ref| source_containers.include?(ref.name) }
      end
    end

    !manual_execution_containers.empty?
  end

  # instructions can be completed/uncompleted multiple times, but only executed once
  def complete!(has_completed)
    complete_execute_instruction(has_completed)
    clean_up_reservation
    WebHookService.instruction_completed(self)
  end

  def complete_execute_instruction(has_completed)
    now = Time.now

    run.with_lock do
      if has_completed
        self.completed_at = now

        if not self.executed_at
          execute!
        end
      else
        self.completed_at = nil
      end

      save!
    end
  end

  def clean_up_reservation
    run.with_lock do
      # Delete reservations for instruction and maybe for run itself.
      ReservationManager.complete_instruction(self.id)

      inform_run_instruction_has_been_completed
    end
  end

  def finalized_data_conversion
    run.with_lock do
      inform_run_instruction_has_been_completed
    end
  end

  def inform_run_instruction_has_been_completed
    run.instruction_completed!(self)
  end

  def execute!
    if not executed_at.nil?
      raise "Can't re-execute an instruction"
    end

    self.executed_at = self.completed_at

    manager = ExecutionManager.new(run.referenced_containers)
    execution_context = manager.execute([ self ])
    execution_context.persist_all
  end

  def undo
    update(completed_at: nil, completed_by_admin_id: nil, completed_by_human: false)
  end

  def parsed
    @parsed ||= parse_operation(operation)
  end

  def operation_as_executed_parsed
    parse_operation(operation_as_executed)
  end

  private

  # use the public 'parsed' method if you need the parsed instruction. We cache
  # the value of this method because parsing is an expensive operation.
  def parse_operation(operation)
    parser         = Autoprotocol::Parser.new
    parser.context = { instruction: sequence_no }
    inst           = parser.parse_instruction(operation, sequence_no)

    unless parser.errors.empty?
      raise InstructionParseError, parser.errors
    end

    inst
  end

  class InstructionError < StandardError
  end

  class InstructionParseError < StandardError
    attr_accessor :parse_errors

    def initialize(errors)
      @parse_errors = errors
    end

    def message
      "Errors! #{@parse_errors}"
    end

    def to_s
      message
    end
  end
end
