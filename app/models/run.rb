class Run < ApplicationRecord
  has_snowflake_id('r')
  audited associated_with: :project, except: :conversation_id
  audit_trail only: [ :owner_id, :project_id, :status, :predecessor_id ]

  attr_accessor :test_price, :protocol_pricing
  # Used by #partial_run to subset time constraints when only some instructions
  # are selected through Prime Directive
  attr_accessor :partial_time_constraints
  # Used by #partial_run to store warnings for #partial_time_constraints
  attr_accessor :partial_time_constraints_warnings
  # Used by #partial_run to subset partitions when only some instructions
  # are selected through Prime Directive
  attr_accessor :partial_x_partition

  belongs_to :project
  belongs_to :protocol
  belongs_to :owner, class_name: "User"
  belongs_to :conversation, dependent: :destroy
  belongs_to :accepted_by, class_name: "User", foreign_key: "accepted_by_id"
  belongs_to :sent_to_workcell_by, class_name: "Admin", foreign_key: "sent_to_workcell_by_id"
  belongs_to :sent_to_workcell_by_user, class_name: "User", foreign_key: "sent_to_workcell_by_user_id"
  belongs_to :launch_request, dependent: :destroy
  belongs_to :lab
  belongs_to :assigned_to, class_name: "User", foreign_key: "assigned_to_id"

  has_many :contextual_custom_properties, as: :context, dependent: :destroy
  has_many :instructions, -> { order 'sequence_no ASC' }, dependent: :destroy
  has_many :idt_sequences, through: :instruction
  has_many :refs, dependent: :destroy
  has_many :containers, through: :refs
  has_many :pending_inbound_containers, lambda {
    inbound.joins(:shipment).merge(Shipment.pending_check_in).distinct.select(:id, :shipment_id)
  }, through: :refs, source: :container
  has_many :realized_containers, -> { realized }, through: :refs, source: :container
  belongs_to :predecessor, class_name: "Run"
  has_many :successors, class_name: "Run", foreign_key: "predecessor_id"
  has_many :schedule_requests, dependent: :destroy
  has_many :kit_requests
  has_many :invoice_items
  has_many :runs
  has_many :support_tickets
  has_many :program_executions
  has_many :run_schedules
  has_many :execution_support_artifacts
  has_one  :run_batch
  has_one  :batch, :through => :run_batch
  validates_associated :run_batch

  after_update_commit :execute_post_run_programs

  def self.non_json_column_names
    column_names - [ 'attachments', 'compile_cache', 'draft_quote', 'execution',
                     'quote', 'out_section', 'request', 'results', 'properties' ]
  end

  # Using select here to query for runs, as some fields
  # take extremely long to decode from the DB.
  # Remove all json fields
  scope :without_large_columns, lambda {
    select(non_json_column_names)
  }

  after_save :on_schedule_date_change, if: :saved_change_to_scheduled_to_start_at?
  validates_presence_of :project_id
  validates_presence_of :lab
  validates :scheduled_to_start_at,
            presence: true,
            future_date: true,
            if: :saved_change_to_scheduled_to_start_at?
  validate :validate_predecessor

  after_create lambda {
    create_outputs
    create_conversation
    Run.update_can_start([ self ])
  }

  after_commit -> { reindex_project if Searchkick.callbacks? }, on: [ :create, :destroy ]

  after_commit lambda {
    if Searchkick.callbacks?
      Project.where(id: project_id_before_last_save).reindex
      reindex_project
    end
  }, on: :update, if: :saved_change_to_project_id?

  after_update_commit lambda {
    WORKFLOW_RABBIT_SERVICE.publish_run_update(run: self)
  }

  # ESA generation
  after_create_commit lambda {
    op_to_instruction_ids = instructions.where(generates_execution_support_artifacts: true)
                                        .order(:sequence_no)
                                        .select(:id, :op)
                                        .group_by(&:op)
                                        .transform_values { |instructions| instructions.map(&:id) }
    op_to_instruction_ids.each do |_op, instruction_ids|
      EsaGeneratorJob.perform_async(self.id, instruction_ids)
    end
  }

  before_create lambda {
    if predecessor&.batch.present? && batch.present? && predecessor.batch.id != batch.id
      errors.add(:message, 'Batch provided does not match with parent run batch')
      throw(:abort)
    else
      self.batch = predecessor&.batch || batch
    end
  }

  # For our analytics job
  scope :completed_last_Ndays, lambda { |num_days|
    where("completed_at > ?", Time.now - num_days.days).where(test_mode: false)
  }

  searchkick(batch_size: 200, callbacks: :async, word_start: [ :id, :container_ids, :container_barcodes ],
             word_middle: [ :title, :protocol_name ])

  def validate_predecessor
    if predecessor_id.present? &&
       !Run.joins(:project).exists?(id: predecessor_id, projects: { organization_id: project.organization_id })
      errors.add(:predecessor, 'Invalid predecessor')
    end
  end

  def should_index?
    !lab_id.nil?
  end

  def is_implementation?
    self.project.is_implementation?
  end

  def reindex_project
    project.reindex(mode: :inline, refresh: :wait_for)
  end

  def search_data
    run_containers = referenced_containers_id_barcode
    {
      id: id,
      title: title,
      scheduled_to_start_at: scheduled_to_start_at,
      status: status,
      started_date: started_at,
      created_date: created_at,
      aborted_date: aborted_at,
      completed_date: completed_at,
      requested_date: requested_at,
      container_ids: run_containers.map { |c| c[0] },
      container_barcodes: run_containers.map { |c| c[1] }.compact,
      assigned_to: assigned_to_id,
      lab_id: lab_id,
      organization_id: project.organization_id,
      organization_name: organization_name,
      priority: priority,
      estimated_run_time_cache: estimated_run_time_cache,
      created_at: created_at,
      protocol_name: protocol&.name,
      total_cost: total_cost,
      scheduled_workcell: scheduled_workcell,
      accepted_date: accepted_at,
      accepted_by_id: accepted_by_id,
      rejected_at: rejected_at,
      reject_reason: reject_reason,
      predecessor_id: predecessor_id,
      project_id: project_id,
      owner_id: owner_id,
      test_mode: test_mode,
      internal_run: internal_run,
      canceled_at: canceled_at
    }
  end

  def self.flat_json
    { only: self.non_json_column_names, include: {}, methods: [] }
  end

  def self.short_json
    {
      only: [
        :id, :status, :title, :protocol_id, :accepted_at, :accepted_by_id, :created_at, :updated_at,
        :started_at, :completed_at, :canceled_at, :aborted_at, :predecessor_id,
        :test_mode, :progress, :request_type, :flagged, :bsl, :launch_request_id, :success, :success_notes,
        :estimated_run_time_cache, :priority, :lab_id, :requested_at, :scheduled_workcell, :scheduled_to_start_at,
        :can_start_at, :assigned_to_id, :rejected_at, :reject_reason, :reject_description, :canceled_reason
      ],
      methods: [ :total_cost, :has_quote?, :can_cancel?, :estimated_run_time, :pending_shipment_ids, :billing_valid?,
                 :organization_name, :unrealized_input_containers_count, :protocol_name ],
      include: {
        project: {
          only: [ :id, :name ],
          include: {},
          methods: {}
        },
        protocol: {
          only: [ :name ]
        },
        owner: User::SHORT_JSON
      }
    }
  end

  def self.admin_full_json
    {
      only: [
        :id, :status, :title, :protocol_id, :conversation_id, :accepted_at, :accepted_by_id,
        :created_at, :updated_at, :progress, :request_type, :started_at,
        :completed_at, :canceled_at, :aborted_at, :predecessor_id, :quote,
        :draft_quote, :results, :test_mode, :flagged, :properties, :launch_request_id,
        :internal_run, :bsl, :requested_at, :rejected_at, :assigned_to_id,
        # extends full_json
        :scheduled_to_start_at, :scheduled_workcell, :lab_id
      ],
      methods: [
        :total_cost, :has_quote?, :can_cancel?, :warnings, :pending_shipment_ids, :billing_valid?,
        # Above methods are in full_json.  Below methods extend full_json.
        :friendly_status, :closed?, :estimated_run_time, :time_constraints
      ],
      include: {
        unrealized_input_containers: Container.flat_json,
        dependents: Run.flat_json,
        datasets: Dataset.short_json,
        refs: Ref.full_json,
        # replaced User::SHORT_JSON from full_json
        owner: { only: [ :id, :email ], methods: [ :name ], include: {}},
        # extends full_json
        accepted_by: { only: [ :id, :email ], methods: [ :name ], include: {}},
        # replaced Project.mini_json from full_json
        project: {
          only: [ :id, :name, :archived_at, :bsl ],
          methods: [ :visibility_in_words, :is_implementation ],
          include: {
            organization: {
              only: [ :id, :name, :subdomain, :archived_at, :test_account ],
              methods: [],
              include: {}
            }
          }
        },
        predecessor: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        },
        successors: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        },
        # replaced Instruction::SHORT_JSON from full_json
        instructions: Instruction.admin_short_json,
        batch: Batch.flat_json
      }
    }
  end

  def self.full_json
    {
      only: [
        :id, :status, :title, :protocol_id, :conversation_id, :accepted_at, :accepted_by_id,
        :created_at, :updated_at, :progress, :request_type, :started_at,
        :completed_at, :canceled_at, :aborted_at, :quote,
        :draft_quote, :results, :test_mode, :flagged, :properties, :launch_request_id,
        :internal_run, :bsl, :scheduled_to_start_at, :success, :success_notes, :priority,
        :requested_at, :predecessor_id, :estimated_run_time_cache
      ],
      methods: [ :total_cost, :has_quote?, :can_cancel?, :warnings, :pending_shipment_ids,
                 :billing_valid? ],
      include: {
        unrealized_input_containers: Container.flat_json,
        dependents: Run.flat_json,
        datasets: Dataset.short_json,
        refs: Ref.full_json,
        owner: User::SHORT_JSON,
        project: Project.mini_json,
        predecessor: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        },
        successors: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        },
        instructions: Instruction::SHORT_JSON,
        batch: Batch.flat_json
      }
    }
  end

  def self.admin_json
    {
      only: [
        :id, :title, :status, :created_at, :protocol_id, :project_id, :updated_at, :accepted_at, :accepted_by_id,
        :started_at, :completed_at, :canceled_at, :aborted_at,
        :quote, :scheduled_to_start_at, :scheduled_workcell, :properties,
        :internal_run, :bsl
      ],
      methods: [ :friendly_status, :has_quote?, :closed?, :estimated_run_time, :billing_valid? ],
      include: {
        owner: { only: [ :id, :email ], include: {}, methods: [ :name ] },
        accepted_by: { only: [ :id, :email ], include: {}, methods: [ :name ] },
        sent_to_workcell_by: { only: [ :id, :email ], include: {}, methods: [ :name ] },
        sent_to_workcell_by_user: { only: [ :id, :email ], include: {}, methods: [ :name ] },
        project: {
          only: [ :id, :name, :bsl ],
          include: { organization: { only: [ :subdomain, :name, :test_account ], include: {}, methods: [] }},
          methods: [ :visibility_in_words ]
        },
        refs: {
          only: [ :name ],
          methods: [],
          include: {
            container: Container.mini_json
          }
        }
      }
    }
  end

  def self.mini_json
    {
      only: [ :id, :status, :title ],
      include: {},
      methods: []
    }
  end

  def self.minimal_json
    # minimal_json is a transitonal JSON structure that is based on full_json.
    # More and more attributes / relationships of the run object will be fetched by JSON API,
    # and minimal_json will have less and less fetching responsibilities.

    {
      only: [
        :id, :status, :title, :protocol_id, :conversation_id, :accepted_at, :accepted_by_id,
        :created_at, :updated_at, :progress, :request_type, :started_at,
        :completed_at, :canceled_at, :aborted_at,
        :draft_quote, :results, :test_mode, :flagged, :properties, :launch_request_id,
        :internal_run, :bsl, :scheduled_to_start_at, :success, :success_notes
      ],
      methods: [ :total_cost, :has_quote?, :can_cancel?, :warnings, :pending_shipment_ids,
                 :billing_valid? ],
      include: {
        unrealized_input_containers: Container.flat_json,
        dependents: Run.flat_json,
        datasets: Dataset.short_json,
        owner: User::SHORT_JSON,
        project: Project.mini_json,
        predecessor: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        },
        successors: {
          only: [ :id, :status, :title ],
          methods: [],
          include: {
            project: Project.mini_json
          }
        }
      }
    }
  end

  # This helper function will determine the necessary action to transition
  # to the requested state. This allows a client to request a state change without
  # inspecting the current state of the model and determining the required action.
  def set_status(status, manual = false)
    if status_paths.to_states.exclude?(status)
      errors.add(:Unknown_Status, status.to_s)
      return false
    end

    status_path = status_paths(to: status).find { |path| path.size == 1 }

    if status_path.nil?
      errors.add(:InvalidTransition, "Cannot transition state via #{status} from #{self.status}")
    end

    event = status_path.first.event
    if event == :bill && manual
      bill_manually
    else
      fire_events(event)
    end
  end

  def bsl2?
    bsl == 2
  end

  def self.line_item_hash(cost, quantity, title, run_id, credit = true)
    {
      'cost' => cost.round(2),
      'quantity' => quantity,
      'title' => title,
      'run_id' => run_id,
      'run_credit_applicable' => credit
    }
  end

  def self.price(run)
    price = PricingManager.price_for_run run
    if Rails.env.test? && run.test_price
      price.children << PricingManager::PriceNode.new("Test Price", run.test_price)
    end
    price
  end

  def self.internal_quote(run)
    price_tree = Run.price(run)

    ppp_pricing = run.protocol_pricing.present?
    ppp_total   = nil

    items =
      if ppp_pricing
        ppp_items = (run.protocol_pricing || []).map do |line_item|
          Run.line_item_hash(line_item['price_each'], line_item['quantity'], line_item['description'], run.id)
        end

        ppp_total = ppp_items.sum { |i| i['cost'].to_f * i['quantity'].to_f }

        ppp_items
      else
        creditable_costs, non_creditable_costs =
          price_tree.flatten.partition(&:run_credit_applicable)

        creditable_costs_items = [ Run.line_item_hash(creditable_costs.sum(&:total), 1, 'Workcell Time', run.id) ]

        non_creditable_costs_items =
          if non_creditable_costs.sum(&:total) != 0
            [ Run.line_item_hash(non_creditable_costs.sum(&:total), 1, 'Reagents & Consumables', run.id, false) ]
          else
            []
          end

        creditable_costs_items + non_creditable_costs_items
      end

    {
      'items' => items,
      'breakdown' => price_tree.as_json,
      'ppp' => ppp_pricing,
      'ppp_total' => ppp_total,
      'internal_total' => price_tree.total
    }
  end

  def self.external_quote(run)
    quote = Run.internal_quote(run)
    Run.remove_internal_items(quote)
    quote
  end

  def self.remove_internal_items(quote)
    quote.delete('ppp_total')
    quote.delete('internal_total')
    quote.delete('breakdown')
  end

  OPEN_STATES   = [ :pending, :accepted, :in_progress ]
  CLOSED_STATES = [ :complete, :aborted, :billed, :declined, :canceled, :rejected ]
  STATES        = OPEN_STATES + CLOSED_STATES

  def is_open
    OPEN_STATES.include?(status.to_sym)
  end

  def is_closed
    CLOSED_STATES.include?(status.to_sym)
  end

  def self.open_state_names
    OPEN_STATES.map { |s| human_status_name(s) }
  end

  def self.closed_state_names
    CLOSED_STATES.map { |s| human_status_name(s) }
  end

  def self.state_names
    STATES.map { |s| human_status_name(s) }
  end

  def can_start?
    accepted? && validate_inputs.empty?
  end

  # checks if the argument runs can be started and if so, sets the can_start_at time
  def self.update_can_start(runs)
    startable = runs.reject(&:can_start_at)
                    .select(&:can_start?)
                    .map(&:id)

    Run.where(id: startable).update_all(can_start_at: Time.now)
  end

  state_machine :status, :initial => :pending do
    STATES.each { |s| state s }

    state(*CLOSED_STATES) do
      def closed?
        true
      end
    end
    state all - CLOSED_STATES do
      def closed?
        false
      end
    end

    event :accept do
      transition :pending => :accepted
    end

    event :start do
      transition :accepted => :in_progress
    end

    event :complete do
      transition :in_progress => :complete
    end

    # was `abort` but that's a reserved word
    event :bail do
      transition :in_progress => :aborted
    end

    event :bill do
      transition [ :in_progress, :complete ] => :billed
    end

    event :cancel do
      transition [ :pending, :accepted ] => :canceled
    end

    event :reject do
      transition :pending => :rejected
    end

    before_transition on: :start do |run, _transition|
      run.started_at = Time.now

      # validate run inputs unless this is a test mode run
      can_transition = true
      if !run.test_mode
        errors = run.validate_inputs
        errors.each do |error|
          run.errors.add(error[:name], error[:message])
        end
        can_transition = errors.empty?
      end

      if can_transition
        WebHookService.run_started(run)
      end
      can_transition
    end

    before_transition on: :complete do |run, _transition|
      run.completed_at = Time.now
      Run.update_can_start(run.generated_containers.flat_map(&:runs))

      can_transition = true
      uncompleted_instructions = run.instructions.select { |ins| ins.completed_at.nil? }
      if !uncompleted_instructions.empty?
        run.errors.add(:UncompletedInstructions, uncompleted_instructions.map(&:id))
        can_transition = false
      else
        run.assign_outputs
      end

      if can_transition
        update_consumables(run)
        WebHookService.run_completed(run)
      end
      can_transition
    end

    before_transition on: :accept do |run, _transition|
      run.accepted_at = Time.now
    end

    before_transition on: :bail do |run, _transition|
      run.aborted_at = Time.now
    end

    before_transition on: :cancel do |run, _transition|
      run.canceled_at = Time.now
    end

    before_transition on: :reject do |run, _transition|
      run.rejected_at = Time.now
    end

    after_transition on: :start do |run, _transition|
      run.refs.each do |ref|
        if ref.container.present?
          ref.container.run_count += 1
          ref.container.save!
        end
      end
      NOTIFICATION_SERVICE.run_started(run) unless run.test_mode || run.is_implementation?
    end

    after_transition on: :complete do |run, _transition|
      DiscardContainersOnRunCompletionJob.perform_in(1.minutes, run.id)

      if run.test_mode
        next
      end

      NOTIFICATION_SERVICE.run_completed(run) unless run.is_implementation?
      run.link_invoice_items unless run.is_implementation?
      ClearPendingTisoReservationsJob.perform_in(10.minutes, run.id)
    end

    after_transition on: :bail do |run, _transition|
      ReservationManager.complete_run(run.id)
      run.cleanup
      NOTIFICATION_SERVICE.run_aborted(run) unless run.test_mode || run.is_implementation?
      run.link_invoice_items unless run.is_implementation?
    end

    after_transition on: :cancel do |run, _transition|
      run.cleanup
      NOTIFICATION_SERVICE.run_canceled(run) unless run.test_mode || run.is_implementation?
      # Destroy all charges associated with this run
      run.invoice_items.destroy_all
    end

    after_transition on: :bill do |run, _transition|
      run.send_quote_to_xero unless run.is_implementation?
    end

    after_transition on: :accept do |run, _transition|
      if run.project.organization.run_approval != 'never' && !run.is_implementation?
        NOTIFICATION_SERVICE.run_accepted(run)
      end
    end

    after_transition on: :reject do |run, _transition|
      if run.project.organization.run_approval != 'never' && !run.is_implementation?
        NOTIFICATION_SERVICE.run_rejected(run)
      end
    end

    def update_consumables(run)
      Searchkick.callbacks(false) do
        can_create_consumable = run.project.organization.can_create_consumable?
        return unless can_create_consumable

        ActiveRecord::Base.transaction do
          refs = run.refs.includes(:container)
                    .where({ containers: { status: Container::STATUS_INBOUND_CONSUMABLE }})
                    .where.not({ containers: { empty_mass_mg: nil }})
          refs.each do |ref|
            container = ref.container
            container.update!(status: Container::STATUS_CONSUMABLE)
            container.reindex(:container_search_data, mode: :async)
          end
        end
      end
    end
  end

  def self.validate_workcell_json(workcell_json)
    retired_ids = workcell_json[:containertypes]
                  .select { |_id, ct| ct["retired_at"].present? }
                  .keys

    if retired_ids.empty?
      nil
    else
      "Cannot generate workcell.json because this run uses "\
        "the retired container types: #{retired_ids}"
    end
  end

  def cleanup
    cancel_dependent_runs
    destroy_outputs
  end

  # Unrealized containers that aren't generated by this run but are required for this run to execute.
  # NOTE: This is written this way to not incur an N+1 query related to how the unrealized scope on Container worked.
  def unrealized_input_containers
    (containers.filter(&:generated_by_run_id) - realized_containers).reject { |c| c.generated_by_run_id == self.id }
  end

  def unrealized_input_containers_count
    unrealized_input_containers.size
  end

  # Prevents starting a run that is missing required containers.
  # This prevention occurs if the run is:
  # 1. waiting on containers to be generated by another run
  # 2. waiting on a shipment
  #
  def validate_inputs
    errors = []

    unmet_dependencies = unrealized_input_containers
    if !unmet_dependencies.empty?
      errors << {
        name: :UnmetDependency,
        message: "Run #{id} depends on the following #{'container'.pluralize(unmet_dependencies.length)}: "\
                 "#{unmet_dependencies.map(&:id).join(' ')} which #{'has'.pluralize(unmet_dependencies.length)} "\
                 "not been created yet."
      }
    end

    if !inbound_containers.empty?
      errors << {
        name: :AwaitingShipment,
        message: "Run #{id} depends on the following #{'container'.pluralize(inbound_containers.length)}: "\
                 "#{inbound_containers.join(' ')} which #{'has'.pluralize(inbound_containers.length)} "\
                 "not been delivered yet."
      }
    end

    errors
  end

  def cancel_and_cleanup(reason = nil)
    transaction do
      self.canceled_reason = reason
      self.cancel
      clear_run_schedules
      self
    end
  end

  def abort_and_cleanup(reason = nil)
    transaction do
      self.aborted_reason = reason
      self.bail
      clear_subsequent_run_schedules
      self
    end
  end

  def clear_subsequent_run_schedules
    RunSchedule.where(run: self).where("start_date_time >= ?", DateTime.now).map(&:delete)
  end

  def clear_run_schedules
    RunSchedule.where(run: self).map(&:delete)
  end

  def reject_and_cleanup(reason, description = nil)
    transaction do
      self.reject_reason = reason
      self.reject_description = description
      self.reject
      self
    end
  end

  def protocol=(protocol)
    # Parse
    parser = Autoprotocol::Parser.parse protocol
    parser.errors.each { |err| errors.add(:protocol, err.as_json) }
    return unless parser.errors.empty?

    # Map containers
    container_type_map = Hash[ContainerType.active.map { |ct| [ ct.shortname, ct ] }]
    containers = Container.where(
      id: parser.referenced_container_ids
    )
    container_map = {}
    org = self.organization
    permissions = ACCESS_CONTROL_SERVICE.user_acl(self.owner, org)
    user_context = UserContext.new(self.owner, org&.id, permissions)
    containers.each do |c|
      next unless self.owner and ContainerPolicy.new(user_context, c).use?

      if c.test_mode != self.test_mode
        errors.add(:protocol, {
          message: "Container #{c.id} is#{c.test_mode ? '' : ' not'} a test-mode container"
        })
        next
      elsif !c.ready_for_run
        errors.add(:protocol, {
          message: "Container #{c.id} (#{c.status}) is not available for use in runs."
        })
      end

      container_map[c.id.to_s] = c
    end
    return unless errors.empty?

    resource_ids = parser.referenced_resource_ids.to_a
    organization_ids = [ nil ]
    if !lab.nil? && !lab.operated_by_id.nil?
      organization_ids.push(lab.operated_by_id)
    end
    resources    = Resource.where(id: resource_ids, organization_id: organization_ids)
    resource_map = resources.map { |r| [ r.id, r ] }.to_h

    reserved_omcs = OrderableMaterialComponent.where(id: parser.reserved_omc_ids).to_a
    resource_omcs = OrderableMaterialComponent
                    .joins(:material_component)
                    .where(material_components: {
                      resource_id: resource_ids
                    })
    orderable_material_components = reserved_omcs + resource_omcs
    omc_by_id = orderable_material_components.map { |omc| [ omc.id, omc ] }.to_h

    # Check containers
    checker = Autoprotocol::Checker.check(
      container_map,
      container_type_map,
      omc_by_id,
      resource_map,
      parser
    )
    checker.errors.each { |err| errors.add(:protocol, err.as_json) }
    return unless checker.errors.empty?

    begin
      is_special_lcms_case = has_lcms_plate_with_lcms_well_aliquot(protocol)
    rescue StandardError => e
      errors.add(:protocol, e.message)
      return
    end

    if is_special_lcms_case
      self.refs = create_lcms_refs(parser)
      original_instructions = create_instructions(protocol, parser)
      self.instructions = override_instruction_refs(original_instructions)
    else
      self.refs = create_refs(parser)
      self.instructions = create_instructions(protocol, parser)
    end
    return unless self.errors.empty?

    self.request_type = 'protocol'
    self.request      = JSON.generate({ type: "protocol", raw: protocol })
    self.out_section  = protocol['outs'] || {}
    if self.organization.run_approval == 'never' || self.test_mode
      self.accepted_by  = self.owner
      self.accept
    end

    # Tests can set a fake calculated workcell-time price for a run
    if Rails.env.test? and protocol['test_price']
      self.test_price = protocol['test_price'].to_f.to_d(2)
    end

    if protocol['price']
      errs = JSON::Validator.fully_validate(PRICING_SCHEMA, protocol["price"])

      if not errs.empty?
        errs.each { |err| errors.add(:protocol, err) }
        return nil
      end

      self.protocol_pricing = protocol['price'].map(&:with_indifferent_access)
    end

    self
  end

  PRICING_SCHEMA = {
    type: "array",
    items: [
      {
        type: "object", required: [ "quantity", "price_each", "description" ],
        properties: {
          quantity:    { type: "number", minimum: 0 },
          price_each:  { type: "number" },
          description: { type: "string" }
        }
      }
    ],

    # metadata
    title: "Pricing Schema",
    description: "Pricing schema json schema"
  }

  def create_refs(parser)
    parser.refs.map do |name, container|
      destiny = {}
      if container.discard
        destiny[:discard] = true
      elsif container.store
        destiny[:store] = container.store
      end

      params = {
        run: self,
        name: name,
        cover: container.cover,
        destiny: destiny
      }

      if container.is_new?
        params[:new_container_type] = container.new
      elsif container.is_reserve?
        params[:orderable_material_component_id] = container.reserve
      else
        params[:container_id] = container.id
        container_by_id = Container.find(container.id)
        if container_by_id.organization.present? && container_by_id.organization.id != self.organization.id
          self.errors.add(:protocol, {
            message: "Container #{container_by_id.id} does not belong to run's organization"
          })
        end
      end
      Ref.new(params)
    end
  end

  # For lcms containers,
  # we currently require this hack for creating multiple refs from the outs field instead of using the specified ref.
  # The desired container_id is expected as part of the aliquot properties.
  def create_lcms_refs(parser)
    parser.outs.values[0].map do |name, aliquot|
      container = parser.refs.values[0]
      destiny = {}
      if container.discard
        destiny[:discard] = true
      elsif container.store
        destiny[:store] = container.store
      end
      params = {
        run: self,
        name: name,
        cover: container.cover,
        destiny: destiny,
        container_id: aliquot['properties']['container_id']
      }
      Ref.new(params)
    end
  end

  def override_instruction_refs(instructions)
    instructions.map.with_index do |instruction, index|
      instruction.refs = [ self.refs[index] ]
      instruction
    end
  end

  def create_instructions(protocol, parser)
    parser.instructions.map.with_index do |instruction, _index|
      ins = Instruction.new(
        run: self,
        sequence_no: instruction.sequence_no,
        op: instruction.op,
        data_name: instruction.try(:dataref) # only some instructions have this method
      )

      # Link refs to instruction
      ins.refs = self.refs.select { |ref| instruction.refs.include? ref.name }

      original_instruction = protocol['instructions'][instruction.sequence_no]

      if instruction.data[:x_human] || ins.requires_manual_execution?(instruction)
        original_instruction['x_human'] = true
      end

      ins.operation = original_instruction
      ins.parsed = instruction

      ins
    end
  end

  # This function checks to see if the protocol meets special lcms case, which is used
  # to determine if the refs and instructions for the protocol should be created differently.
  def has_lcms_plate_with_lcms_well_aliquot(protocol)
    # check if every instruction in the protocol is 'lcms' op
    protocol['instructions'].each do |instruction|
      if instruction['op'] != 'lcms'
        return false
      end
    end
    # check if refs only contain one container and it is of type '96-vbottom-microwell'
    container_id = protocol['refs'].values[0]['id']
    if container_id.nil? ||
       protocol['refs'].count != 1 ||
       Container.find(container_id)['container_type_id'] != '96-vbottom-microwell'
      return false
    end

    # check if outs contain 'container_id' property that is of type 'single-vbottom-microwell'
    protocol['outs'].values[0].each_value do |aliquot|
      aliquot_property = aliquot['properties']
      if !aliquot_property.key?('container_id')
        return false
      end

      container_id = aliquot_property['container_id']
      if Container.find(container_id)['container_type_id'] != 'single-vbottom-microwell'
        return false
      end
    end
    return true
  end

  def bill_manually
    self.status = 'billed'
    self.save
  end

  def send_quote_to_xero
    url_helpers = Rails.application.routes.url_helpers

    invoice         = $xero.Invoice.build
    invoice.contact = organization.xero_contact
    invoice.type    = "ACCREC"
    invoice.url     = url_helpers.organization_project_run_url(organization,
                                                               project,
                                                               self,
                                                               host: "secure.transcriptic.com")

    invoice.add_line_item(xero_line_item_attributes)
    invoice.due_date = Time.now.advance(days: 30)

    raise "Invoice was not saved to Xero: #{invoice.errors}" unless invoice.save

    invoice
  end

  def xero_line_item_attributes
    # TODO: is this even being used anymore?
    quote["items"].map do |item|
      line_item_attributes = {
        description: item["title"],
        quantity: item["quantity"],
        unit_amount: item["cost"],
        account_code: InvoiceItem::XERO_ACCOUNT_MOLECULAR_BIOLOGY
      }

      line_item_attributes
    end
  end

  def required_orderable_materials
    orderable_material_component_refs = refs.select(&:is_reserve?)

    # count how many of each orderable_material we need
    orderable_material_component_refs.group_by { |ref|
      ref.orderable_material_component.orderable_material_id
    }.map do |orderable_material_id, refs|
      quantity_needed = refs.group_by(&:orderable_material_component_id).values.map(&:size).max
      [ orderable_material_id, quantity_needed, refs ]
    end
  end

  def changed_aliquots(container_ids: self.containers.pluck(:id))
    @changed_aliquots ||= Set.new
    @container_ids_processed_aliquots ||= []

    container_ids_to_process = container_ids - @container_ids_processed_aliquots

    return @changed_aliquots if container_ids_to_process.empty?

    @container_ids_processed_aliquots += container_ids_to_process

    container_by_ref = referenced_containers
    out_section_map = out_section.map { |ref_name, containers_data|
      if container_ids_to_process.include?(container_by_ref[ref_name].id)
        [ container_by_ref[ref_name].id, containers_data ]
      end
    }.compact

    containers = Container.with_deleted.includes(:container_type, :aliquots)
                          .where(id: out_section_map.transpose.first&.compact)

    out_section_map.each do |ct_id, aliquots_data|
      container = containers.find { |ct| ct.id == ct_id }
      next unless container.present?

      container_type = container.container_type

      # Create map of robot_well_idx -> actions
      sanitized_data = aliquots_data.map { |well_idx, actions|
        robot_idx = container_type.robot_well(well_idx)
        robot_idx ? [ robot_idx, actions ] : nil
      }.compact.to_h

      aliquots = container.aliquots.filter { |aliquot| sanitized_data.keys.include?(aliquot.well_idx) }

      # Update aliquot's name
      aliquots.each do |aq|
        actions = sanitized_data[aq.well_idx]
        if aq and actions['name']
          aq.name = actions['name']
        end
        if aq and actions['properties']
          old_props = aq.properties || {}
          new_props = actions['properties']
          aq.properties = old_props.merge(new_props)
        end
        @changed_aliquots.add(aq)
      end
    end

    @changed_aliquots
  end

  def changed_contextual_custom_properties(container_ids: containers.pluck(:id))
    @changed_contextual_custom_properties ||= {}

    container_ids_to_process = container_ids - @changed_contextual_custom_properties.keys.map(&:to_s)

    return @changed_contextual_custom_properties if container_ids_to_process.empty?

    container_by_ref = referenced_containers
    filtered_container_by_ref = container_by_ref
                                .select { |_, container| container_ids_to_process.include?(container.id) }
    container_id_by_ref = filtered_container_by_ref.transform_values(&:id)
    out_section_map = out_section.slice(*container_id_by_ref.keys).transform_keys { |ref| container_id_by_ref[ref] }

    containers = Container.with_deleted
                          .includes(:container_type,
                                    contextual_custom_properties: [ :contextual_custom_properties_config ])
                          .where(id: out_section_map.keys)

    out_section_map.each do |ct_id, containers_data|
      container = containers.find { |ct| ct.id == ct_id }
      next unless container.present? and containers_data['contextual_custom_properties'].present?

      old_properties = container.contextual_custom_properties
      props_to_upsert = containers_data['contextual_custom_properties'].map do |key, value|
        old_property = old_properties.find { |property| key == property.contextual_custom_properties_config.key }
        {
          key: key,
          label: key.humanize,
          context_id: container.id,
          context_type: 'Container',
          value: value,
          org_id: container.organization_id,
          contextual_custom_properties_config_id: old_property&.id,
          contextual_custom_properties_id: old_property&.id
        }
      end
      @changed_contextual_custom_properties[ct_id] = props_to_upsert.flatten.compact

      # Create map of robot_well_idx -> actions
      sanitized_data = containers_data.map { |well_idx, actions|
        robot_idx = container.container_type.robot_well(well_idx)
        robot_idx ? [ robot_idx, actions ] : nil
      }.compact.to_h

      aliquots = Aliquot.includes(contextual_custom_properties: [ :contextual_custom_properties_config ])
                        .where(container_id: container.id, well_idx: sanitized_data.keys)

      aliquots.each do |aq|
        actions = sanitized_data[aq.well_idx]
        next unless aq and actions['contextual_custom_properties']

        old_properties = aq.contextual_custom_properties
        props_to_upsert = actions['contextual_custom_properties'].map do |key, value|
          old_property = old_properties.find { |property| key == property.contextual_custom_properties_config.key }
          {
            key: key,
            label: key.humanize,
            context_id: aq.id,
            context_type: 'Aliquot',
            value: value,
            org_id: container.organization_id,
            contextual_custom_properties_config_id: old_property&.id,
            contextual_custom_properties_id: old_property&.id
          }
        end
        @changed_contextual_custom_properties[aq.id] = props_to_upsert.compact
      end
    end
    @changed_contextual_custom_properties
  end

  def changed_containers(container_ids: self.containers.pluck(:id))
    @changed_containers ||= Set.new
    @container_ids_processed_containers ||= []

    container_ids_to_process = container_ids - @container_ids_processed_containers

    return @changed_containers if container_ids_to_process.empty?

    @container_ids_processed_containers += container_ids_to_process

    container_by_ref = referenced_containers
    filtered_container_by_ref = container_by_ref
                                .select { |_, container| container_ids_to_process.include?(container.id) }
    out_section_map = out_section
                      .slice(*filtered_container_by_ref.keys).transform_keys { |ref| filtered_container_by_ref[ref] }

    out_section_map.each do |container, containers_data|
      # Update container's properties
      if container and containers_data['properties']
        old_props = container.properties || {}
        new_props = containers_data['properties']
        container.properties = old_props.merge(new_props)
      end
      @changed_containers.add(container)
    end

    @changed_containers
  end

  def assign_outputs
    return unless out_section

    unless changed_aliquots.empty?

      changed_aliquots.each(&:run_bulk_import_callbacks)

      # Generate a value statement for each row being updated.
      values_sql = changed_aliquots.map { |a|
        # sanitize all fields.j:
        id = ActiveRecord::Base.connection.quote(a.id)
        name = ActiveRecord::Base.connection.quote(a.name).tr('/', '_')
        properties = ActiveRecord::Base.connection.quote(a.properties.to_json)

        "(#{id}, #{name}, #{properties})"
      }.join(', ')

      # Bulk update aliquots in DB
      ActiveRecord::Base.connection.execute(<<-SQL)
        UPDATE aliquots AS aq SET
          name = aq2.name, properties = aq2.properties::json
        FROM (VALUES
          #{values_sql}
        ) as aq2(id, name, properties)
        WHERE aq2.id = aq.id
      SQL

      # Reindex aliquots
      changed_aliquots.each(&:reindex)
    end

    unless changed_containers.empty?
      # Generate a value statement for each row being updated.

      changed_containers.each(&:run_bulk_import_callbacks)

      values_sql = changed_containers.map { |a|
        # sanitize all fields.j:
        id = ActiveRecord::Base.connection.quote(a.id)
        properties = ActiveRecord::Base.connection.quote(a.properties.to_json)

        "(#{id}, #{properties})"
      }.join(', ')

      # Bulk update containers in DB
      ActiveRecord::Base.connection.execute(<<-SQL)
        UPDATE containers AS cn SET
          properties = cn2.properties::json
        FROM (VALUES
          #{values_sql}
        ) as cn2(id, properties)
        WHERE cn2.id = cn.id
      SQL
    end

    unless changed_contextual_custom_properties.empty?
      properties_to_insert_update = changed_contextual_custom_properties.values.flatten.partition do |property|
        property[:contextual_custom_properties_id].nil?
      end
      properties_to_insert = properties_to_insert_update[0]
      properties_to_update = properties_to_insert_update[1]

      config_id_to_config = properties_to_insert
                            .map { |p| p.slice(:key, :org_id, :context_type) }.uniq
                            .map { |e| e.transform_keys { |k| k == :org_id ? :organization_id : k } }
                            .reduce(ContextualCustomPropertiesConfig.none) { |acc, curr|
                              acc.or(ContextualCustomPropertiesConfig.where(curr))
                            }.index_by(&:key)

      ContextualCustomProperty.import!(
        properties_to_insert.map do |property|
          ContextualCustomProperty.new(
            :id => ContextualCustomProperty.generate_snowflake_id,
            :contextual_custom_properties_config => config_id_to_config[property[:key]],
            :context_type => property[:context_type],
            :context_id => property[:context_id],
            :value => property[:value]
          )
        end,
        batch_size: 50
      )

      if properties_to_update.length > 0
        values_sql = properties_to_update.map { |a|
          id = ActiveRecord::Base.connection.quote(a[:contextual_custom_properties_id])
          val = ActiveRecord::Base.connection.quote(a[:value])
          "(#{id}, #{val})"
        }.join(', ')

        ActiveRecord::Base.connection.execute(<<-SQL)
          UPDATE contextual_custom_properties AS cn SET
            value = cn2.val
          FROM (VALUES#{' '}
            #{values_sql}
          ) as cn2(id,  val)
          WHERE cn.id = cn2.id
        SQL
      end
    end

    containers.each(&:reindex)
  end

  # this method is wrong
  def accepted
    not accepted_at.blank?
  end

  def friendly_status
    case status
    when 'pending'
      'New'
    when 'accepted'
      'Accepted'
    when 'in_progress'
      'In progress'
    when 'complete'
      'Completed'
    when 'aborted'
      'Aborted'
    when 'billed'
      'Billed'
    when 'declined'
      'Declined'
    when 'canceled'
      'Canceled'
    when 'rejected'
      'Rejected'
    end
  end

  def email_target
    if owner
      owner
    elsif organization.users.count > 0
      organization.users.first
    elsif organization.owner
      organization.owner
    else
      # uhhh :(
      User.find_by_email('jeremy@transcriptic.com')
    end
  end

  def has_quote?
    status != 'pending' && quote && !quote["items"].nil? && !quote["items"].blank?
  end

  def recalculate_progress
    count_by_completed = Instruction.where(run_id: self.id).group('completed_at is not null').count
    completed = count_by_completed[true] || 0
    upcoming = count_by_completed[false] || 0
    total = completed + upcoming
    return 0 if total == 0

    ((completed / total.to_f) * 100).to_i
  end

  def instruction_completed!(inst)
    self.execute_post_inst_programs(inst)
    self.update(progress: self.recalculate_progress)

    # Single instruction runs must both start and complete on the same instruction.
    # Both state machine transitions must occur, don't put the below into an elsif.
    if accepted?
      start!
    end

    if can_safely_complete?
      complete!
    end
  end

  def instructions_by_refname
    result = Hash.new { |h, k| h[k] = [] }

    instructions.each do |inst|
      inst.parsed.refs.each do |refname|
        result[refname] << inst
      end
    end

    result
  end

  def referenced_containers
    if new_record?
      # when generating partial runs, we manually set refs on an unsaved run object
      # the includes call causes a DB lookup which returns nil
      refs.map { |r| [ r.name, r.container ] }.to_h
    else
      refs.includes(:container).map { |r| [ r.name, r.container ] }.to_h
    end
  end

  def total_cost
    if quote and not quote['items'].nil?
      quote['items'].inject(0.to_d) do |m, o|
        gross = o['cost'].to_d * o['quantity'].to_d
        m + gross
      end
    else
      0.0
    end
  end

  def display_name
    title || "Run #{id}"
  end

  def organization
    self.project.try(:organization)
  end

  def organization_name
    self.project.organization.name
  end

  def protocol_name
    self.protocol&.name
  end

  def serializable_hash(opts = {})
    opts = Run.full_json.merge(opts || {})
    super(opts)
  end

  def completed?
    self.completed_at != nil
  end

  # Instructions all complete, data uploaded, etc. This should
  # probably be its own state.
  def fully_complete?
    self.completed? and self.has_generated_all_data
  end

  def has_generated_all_data
    missing_count = instructions.includes(:dataset)
                                .where.not(data_name: nil)
                                .where(datasets: { id: nil }).size
    missing_count == 0
  end

  def can_be_seen_by?(user)
    # check for membership using ids, as sometimes the activerecord
    # cache objects don't evaluate as true even though the most certainly are.
    ids = user.organizations.pluck(:id)
    ids.member?(self.organization.try(:id))
  end

  def warnings
    parser = Autoprotocol::Parser.parse(self.request_autoprotocol)
    parser.warnings
  end

  def time_constraints
    constraints =
      if self.partial_time_constraints
        self.partial_time_constraints
      else
        ap = self.request_autoprotocol
        ap['time_constraints']
      end

    constraints || []
  end

  def x_partition
    partitions =
      if self.partial_x_partition
        self.partial_x_partition
      else
        ap = self.request_autoprotocol
        ap['x_partition']
      end
    partitions || []
  end

  def request_autoprotocol
    if self.request.nil?
      {}
    else
      request = JSON.parse(self.request)
      request['raw'] || {}
    end
  end

  def subscriber_ids
    [ self.id, self.project.id, self.project.organization_id ]
  end

  def all_data
    data = {}
    inss = instructions.includes(dataset: [ :device, :warp, :instruction, :project ]).where.not(data_name: nil)

    inss.each do |ins|
      data[ins.data_name] = ins.dataset
    end

    data
  end

  def move(project)
    # hacky magic
    ActiveRecord::Base.transaction do
      self.project = project
      self.save!
      refs.each do |ref|
        ref.container.organization = project.organization
        ref.container.save!
      end
    end
  end

  def partial_run(sequence_nos)
    sub                     = Run.new
    sub.project             = self.project
    sub.owner               = self.owner
    sub.title               = self.title
    if !self.sent_to_workcell_by.nil?
      sub.sent_to_workcell_by = self.sent_to_workcell_by
    end
    if !self.sent_to_workcell_by_user.nil?
      sub.sent_to_workcell_by_user = self.sent_to_workcell_by_user
    end

    instructions = self.instructions.select { |inst| sequence_nos.include?(inst.sequence_no) }

    unless instructions.count == sequence_nos.size
      missing_sequence_nos = instructions.map { |inst|
        if !sequence_nos.include?(inst.sequence_no)
          inst.sequence_no
        end
      }.compact

      raise "Cannot create partial run, instructions with these sequence numbers not found: #{missing_sequence_nos}"
    end

    insts_by_refname = instructions_by_refname

    # Any ref which the run is finished with after executing the selected
    # instructions will be sent to its destiny. If there are still further
    # instructions to be run involving the ref, the container will be "not
    # destinied", i.e., sent to {store: "ambient"} instead of whatever its
    # real destiny is.
    finalizable_ref_names = insts_by_refname.map { |refname, insts|
      if insts.all? { |inst| inst.completed? || sequence_nos.include?(inst.sequence_no) }
        refname
      else
        nil
      end
    }.compact

    finalizable_refs = self.refs.select do |ref|
      finalizable_ref_names.include?(ref.name)
    end

    unless finalizable_refs.count == finalizable_ref_names.size
      missing_refnames = finalizable_refs.map { |ref|
        if !finalizable_ref_names.include?(ref.name)
          ref.name
        end
      }.compact

      raise "Cannot create partial run, the following refnames were not found: #{missing_refnames}"
    end

    # Refnames in the selected instructions
    # Reusing insts_by_refnames to avoid recalculating inst.parsed again.
    mentioned_refnames = insts_by_refname.map { |refname, insts|
      sequence_nos_for_ref = insts.map(&:sequence_no).to_set

      if sequence_nos_for_ref.intersect?(sequence_nos.to_set)
        refname
      else
        nil
      end
    }.compact

    # Duplicated and with modified destinies
    mentioned_refs = self.refs.map { |ref|
      next nil unless mentioned_refnames.include?(ref.name)

      ref = ref.dup

      if not finalizable_ref_names.include?(ref.name)
        ref.destiny = { store: { where: 'ambient', shaking: false }}
      end

      ref
    }.compact

    sub.instructions = instructions
    sub.refs = mentioned_refs

    timing_point_is_relevant = lambda do |tp|
      if tp['ref_start']
        mentioned_refnames.include? tp['ref_start']
      elsif tp['ref_end']
        mentioned_refnames.include?(tp['ref_end']) and finalizable_ref_names.include?(tp['ref_end'])
      elsif tp['instruction_start']
        sequence_nos.include? tp['instruction_start']
      elsif tp['instruction_end']
        sequence_nos.include? tp['instruction_end']
      else
        raise "partial_run wasn't updated when timing constraints changed"
      end
    end

    # Changes the instruction index of a timing point so that it matches up
    # with the partial run (since it might have some instructions removed)
    rebase_timing_point = lambda do |tp|
      if tp['ref_start'] or tp['ref_end']
        tp
      elsif tp['instruction_start'] or tp['instruction_end']
        side, idx = tp.first
        rebased_idx = instructions.find_index { |ins| ins.sequence_no == idx }
        { side => rebased_idx }
      end
    end

    selected_tcs = time_constraints.select do |tc|
      [ tc['from'], tc['to'] ].all?(&timing_point_is_relevant)
    end

    dropped_tcs = time_constraints.select do |tc|
      !selected_tcs.include?(tc) && [ tc['from'], tc['to'] ].any?(&timing_point_is_relevant)
    end

    if !dropped_tcs.empty?
      sub.partial_time_constraints_warnings = dropped_tcs
    end

    sub.partial_time_constraints = selected_tcs.map do |tc|
      constraint = {
        'from' => rebase_timing_point[tc['from']],
        'to' => rebase_timing_point[tc['to']]
      }

      constraint['less_than'] = tc['less_than'] if tc['less_than']
      constraint['more_than'] = tc['more_than'] if tc['more_than']
      constraint['ideal'] = tc['ideal'] if tc['ideal']

      constraint
    end

    # NOTE: For now, we're not doing any fancy logic for filtering with
    # selected time constraints
    selected_parts, unselected_parts = x_partition.partition do |partition|
      (sequence_nos & partition) == partition
    end

    # Partitions are dropped if a partition is not present in full
    dropped_partitions = unselected_parts.select do |partition|
      !(sequence_nos & partition).empty?
    end

    # For now, let's just raise an error, we may want to warn in the future
    if !dropped_partitions.empty?
      raise "partial_run contains dropped partitions: #{dropped_partitions}"
    end

    sub.partial_x_partition = selected_parts

    # It's very important that this little cheat be *last* in this method. If
    # `sub` has an id when `sub#instructions=` is called above, activerecord
    # inexplicably deletes all the instructions in question from the database.
    #
    # go figure.
    sub.id = self.id # cheating! We do this so the workcell gets the appropriate run id.
    sub
  end

  def mark_instructions_as_started
    # this method is used to process instruction for integration workcells. In here we update the instructions and the
    # refs contained within the run. This run will be executed offline and the results uploaded will trigger its
    # completion. We should not execute this again if the run has already been started.
    unless self.started_at?
      # consolidated the code for starting a run, instruction and ref here to bulk insert into the db and bulk reindex
      containers = []

      self.refs.unrealized.includes(:container).each do |ref|
        next unless ref.destiny && ref.destiny['store']

        storage_condition = ref.destiny['store']['where']
        ref.container.storage_condition = storage_condition
        containers |= [ ref.container ]
      end

      ActiveRecord::Base.transaction do
        # bulk update all instructions
        now = Time.now
        self.instructions.update_all(started_at: now)
        containers.each(&:run_bulk_import_callbacks)
        Container.import(containers, validate: false,
                         on_duplicate_key_update: { columns: [ :storage_condition ] })
        self.start!
      end

      containers.each(&:reindex)

      self.reload
    end
  end

  def to_workcell_json(reservations_by_id, fake_provision_sources: false, reserve_destinies: false)
    # Owner will be nil when this run is created by an admin.
    owner_name = self.owner.try('name')
    organization_id = self.organization.try('id')
    admin_name = self.sent_to_workcell_by.try('name')
    user_name  = self.sent_to_workcell_by_user.try('name')

    containers = {}
    destinies = {}
    ref_to_container_id = {}
    container_type_ids = Set.new
    container_data = {}
    provision_sources = {}

    # NOTE: In the `transcriptic analyze` case, the containers in this run
    # aren't in the database yet. That's why we use `ref.container.id` instead
    # of `ref.container_id`.
    self.refs.each do |ref|
      containers[ref.container.id]  = ref.container
      ref_to_container_id[ref.name] = ref.container.id
      destinies[ref.container.id]   = ref.destiny
    end

    fake_aliquots = {}

    if fake_provision_sources
      # In order to compile, we need to fake up some provision source tubes.
      tube_type = ContainerType.find("micro-1.5")
      self.instructions.each do |ins|
        next unless ins.op == 'provision'

        fake_container = Container.new
        fake_container.id = "ct1fake" + SNOWFLAKE.next.to_base31
        fake_container.container_type = tube_type
        fake_container.device_id = "outside"
        fake_container.lab_id = self.lab_id
        containers[fake_container.id] = fake_container
        # NOTE: The volume in this aliquot is arbitrary, but should probably be the sum
        #       of all provision liquid transfers.
        fake_aliquot = Aliquot.new(well_idx: 0, volume_ul: 100)
        fake_aliquots[fake_container.id] = [ fake_aliquot ]
        destinies[fake_container.id] = { discard: true }
        provision_sources[ins.id] =
          ins.operation['to'].map { { containerId: fake_container.id, well: "0" } }
      end
    else
      ProvisionSpec.where(instruction_id: self.instructions.map(&:id)).each do |ps|
        provision_sources[ps.instruction_id] = ps.transfers.map do |lt|
          if not containers[lt["from"]]
            ct = Container.find(lt["from"])
            containers[lt["from"]] = ct
            destinies[lt["from"]] = {
              store: {
                where: ct.storage_condition.presence || 'cold_20',
                shaking: false
              }
            }
          end
          { containerId: lt["from"], well: lt["from_well_idx"].to_s }
        end
      end
    end

    aliquots = Aliquot.where(container_id: containers.keys).select(:container_id, :well_idx, :volume_ul)
    aliquots_by_group = aliquots.group_by(&:container_id)
    aliquots_by_group.merge!(fake_aliquots)

    containers.each do |id, c|
      container_type_ids << c.container_type_id
      aliquots = aliquots_by_group.fetch(c.id, []).map { |aliquot|
        [
          aliquot.well_idx,
          { volume: aliquot.volume_ul ? "#{aliquot.volume_ul}:microliter" : nil }
        ]
      }.to_h
      container_data[id] = {
        id: c.id,
        type: c.container_type_id,
        barcode: c.barcode,
        label: c.label,
        lab_id: self.lab_id,
        location_id: c.location_id,
        cover: c.cover,
        device_id: c.device_id || 'outside',
        slot: c.slot,
        aliquots: aliquots
      }
    end

    container_types = ContainerType.find(container_type_ids.to_a).map { |ct|
      [ ct.id, ct.searchkick_as_json(ContainerType::SHORT_JSON) ]
    }.to_h

    # Instruction.informatics is not used by SCLE, so remove this
    # piece of information from the json.
    instructions = self.instructions.map do |i|
      {
        id: i.id,
        operation: i.operation.dup.tap do |op|
                     op.delete("informatics")
                   end
      }
    end

    {
      run_id: self.id || 'r1temp',
      title: self.title,
      owner: owner_name,
      organization_id: organization_id,
      sent_to_workcell_by: admin_name,
      sent_to_workcell_by_user: user_name,
      refNames: ref_to_container_id,
      containerData: container_data,
      containertypes: container_types,
      destinies: destinies,
      instructions: instructions,
      reservations: reservations_by_id,
      provisionSources: provision_sources,
      timeConstraints: self.time_constraints,
      reserveDestinies: reserve_destinies,
      x_partition: self.x_partition
    }
  end

  def estimated_run_time
    return self.estimated_run_time_cache if not self.estimated_run_time_cache.nil?
  end

  def pending_shipment_ids
    # Large projects sometimes have hundreds of runs, which makes this query
    # expensive to check on every run in the project while displaying the
    # index. Short circuit to the empty list if the run is
    # completed/canceled/aborted, since in general we only care about
    # containers pending shipment on pending runs, and only a few runs in a
    # project will generally be in the 'accepted' state.
    return [] unless status == 'accepted'

    pending_inbound_containers.pluck(:shipment_id)
  end

  def datasets
    if id.present?
      Dataset.where(run_id: id).or(Dataset.where(instruction: Instruction.where(run_id: id)))
    else
      Dataset.none
    end
  end

  def inbound_containers
    containers.inbound.pluck(:id)
  end

  def billing_valid?
    project.has_valid_payment_method?
  end

  def generated_containers
    containers.where(generated_by_run_id: id, kit_request_id: nil)
  end

  def referenced_containers_id_barcode
    containers.with_deleted.pluck(:id, :barcode)
  end

  # runs that require a container that has not yet been generated by this run
  def immediate_dependents
    Run.joins(:containers)
       .where(containers: { id: generated_containers.unrealized })
       .where.not(id: id)
  end

  def dependents
    find_dependents = lambda do |run|
      immediate_deps = run.immediate_dependents.to_a
      dependent_deps = immediate_deps.flat_map(&find_dependents).to_a

      immediate_deps.concat(dependent_deps)
    end

    find_dependents.call(self).uniq(&:id)
  end

  def link_invoice_items
    InvoiceItem.where(run_id: self.id).each(&:link_invoice)
  end

  def execute_post_run_programs
    unless self.fully_complete?
      return
    end

    ProgramExecution.where(run_id: id, started_at: nil).each do |execution|
      ExecuteProgramJob.perform_async(execution.id)
    end
  end

  def execute_post_inst_programs(instruction)
    if !instruction.fully_complete?
      return
    end

    ProgramExecution.where(instruction: instruction, started_at: nil).each do |execution|
      ExecuteProgramJob.perform_async(execution.id)
    end
  end

  def dataset_attached(dataset)
    self.execute_post_run_programs
    self.execute_post_inst_programs(dataset.instruction)
  end

  def datasets_converted?
    datasets.is_measurement.unconverted.or(datasets.is_measurement.processing).count.zero?
  end

  def instructions_completed?
    instructions.in_progress.count.zero?
  end

  def can_safely_complete?
    in_progress? &&
      instructions_completed? &&
      datasets_converted? &&
      # added this check for test mode runs to reach complete status without data attached.
      (self.test_mode ? true : has_generated_all_data)
  end

  def recent_request
    schedule_requests
      .where(created_at: 1.hours.ago...Time.now)
      .where.not(status: ScheduleRequest::STATUS_ABORTED)
      .order(created_at: :desc)
      .first
  end

  private

  def create_conversation
    participants = []
    if not owner_id.blank?
      participants << owner_id
    end
    self.conversation = Conversation.create!({ organization: organization, participants: participants })
  end

  def create_outputs
    reify_new_containers
    reserve_required_orderable_materials
  end

  def destroy_outputs
    destroy_generated_containers
    release_orderable_material_reservations
    destroy_unfulfilled_provision_specs
  end

  def destroy_unfulfilled_provision_specs
    related_provision_specs = ProvisionSpec.joins(:instruction)
                                           .where(
                                             instruction_id: self.instruction_ids,
                                             instructions: { completed_at: nil }
                                           )

    related_provision_specs.destroy_all
  end

  def cancel_dependent_runs
    # if run has already been canceled, run.cancel will return false
    # multiple cancels will not occur
    dependents.reverse_each(&:cancel)
  end

  # Antithesis of reify_new_containers. Destroys all containers that have not yet
  # been generated by run
  def destroy_generated_containers
    pending_generate_container_refs = refs.unrealized.select(&:is_new?)
    pending_containers              = pending_generate_container_refs.map(&:container_id)

    Container.where(id: pending_containers).destroy_all
    Ref.where(id: pending_generate_container_refs).update_all(container_id: nil)
  end

  # Antithesis of reserve_required_orderable_materials. Restocks all kits that have not yet
  # been used by run
  def release_orderable_material_reservations
    pending_reserve_container_refs = refs.unrealized.select(&:is_reserve?)
    pending_containers             = pending_reserve_container_refs.map(&:container)

    # need to clear refs before container can be stockified
    Ref.where(id: pending_reserve_container_refs).update_all(container_id: nil)
    StockManager.stockify_containers pending_containers
  end

  def reify_new_containers
    # Create all new (empty) containers
    refs.each do |ref|
      next unless ref.is_new? and not ref.container

      ref.container                     = Container.new
      ref.container.container_type      = ContainerType.find_by_shortname(ref.new_container_type)
      ref.container.label               = ref.name
      ref.container.generated_by_run_id = id
      ref.container.organization        = project.organization
      ref.container.device_id           = 'supply'
      ref.container.test_mode           = self.test_mode
      ref.container.storage_condition   = ref.storage_condition
      ref.container.cover               = ref.cover
      ref.container.lab_id              = self.lab_id

      if !owner.nil?
        ref.container.created_by = owner.id
      end
      if project.organization.can_create_consumable? && ContainerType::CONSUMABLES.include?(ref.new_container_type)
        ref.container.status = Container::STATUS_INBOUND_CONSUMABLE
      end

      ref.container.save!
      ref.save!
    end
  end

  def reserve_required_orderable_materials
    required_orderable_materials.each do |orderable_material_id, quantity_needed, refs|
      orderable_material = OrderableMaterial.find(orderable_material_id)
      kit_request = StockManager.reserve(orderable_material, quantity_needed, organization, owner, self.id,
                                         test_mode: self.test_mode)
      reserved_containers = kit_request.containers.to_a
      refs.each do |ref|
        idx = reserved_containers.find_index do |cont|
          cont.orderable_material_component_id == ref.orderable_material_component.id
        end
        container = reserved_containers.slice! idx
        ref.container = container
        ref.container.label = ref.name
        ref.container.test_mode = self.test_mode
        ref.container.storage_condition ||= ref.storage_condition
        ref.container.save!
        ref.save!
      end
    end
  end

  def on_schedule_date_change
    if !self.is_implementation? && (self.owner && !self.scheduled_to_start_at.nil?)
      NOTIFICATION_SERVICE.run_scheduled(self)
    end
  end

end
