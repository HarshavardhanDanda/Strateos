class Container < ApplicationRecord
  has_snowflake_id('ct')
  acts_as_paranoid
  audit_trail only: [ :label, :container_type_id, :shipment_id, :shipment_code, :status ]
  audited associated_with: :organization
  include HashUtil

  searchkick(batch_size:     50,
             word_start:     [ :id, :barcode, :generated_by_run_id, :shipment_id, :organization_name ],
             word_middle:    [ :label, :aliquot_names, :compound_link_ids ],
             mappings:       {
               properties: {
                 properties:                           SearchkickUtil::NestedFieldUtil.nested_properties_mapping,
                 contextual_custom_properties:         SearchkickUtil::NestedFieldUtil.nested_properties_mapping,
                 aliquot_properties:                   SearchkickUtil::NestedFieldUtil.nested_properties_mapping,
                 aliquot_contextual_custom_properties: SearchkickUtil::NestedFieldUtil.nested_properties_mapping
               }
             },
             merge_mappings: true,
             callbacks:      :queue,
             searchable:     [ :id,
                               :name,
                               :label,
                               :barcode,
                               :generated_by_run_id,
                               :shipment_id,
                               :organization_name,
                               :batch_ids,
                               :compound_link_ids,
                               :aliquot_names ],
             settings:       {
               index: {
                 mapping: {
                   total_fields: {
                     limit: 5000
                   }
                 }
               }
             })

  scope :search_import, lambda {
    with_deleted.includes(
      :container_type,
      :aliquots,
      :stale_container,
      :compound_links,
      :resource_compounds,
      :compounds,
      :batches,
      :organization,
      :location,
      :contextual_custom_properties,
      :contextual_custom_properties_configs,
      :aliquot_contextual_custom_properties,
      :aliquot_contextual_custom_properties_configs
    )
  }

  belongs_to :container_type
  belongs_to :organization
  belongs_to :device
  belongs_to :kit_order
  belongs_to :location
  belongs_to :shipment
  belongs_to :kit_request
  belongs_to :kit_item
  belongs_to :orderable_material_component
  belongs_to :lab
  belongs_to :intake_kit
  has_many :aliquots, -> { with_deleted }
  has_many :minimal_aliquots, -> { minimal_properties }, class_name: 'Aliquot', foreign_key: 'container_id'
  has_many :container_transfers
  has_one :stale_container
  has_many :tiso_reservations
  has_one :return_sample
  has_one :return_shipment, through: :return_samples

  delegate :height_mm, :is_plate, :is_tube, :lidded_plate_height, to: :container_type
  delegate :col, :row, to: :location, allow_nil: true

  belongs_to :generated_by_run, lambda {
    without_large_columns
  }, class_name: 'Run'

  has_many :aliquot_effects, foreign_key: :affected_container_id
  has_many :refs
  has_many :runs, through: :refs
  has_many :instructions, through: :refs
  has_one :container_destruction_request
  has_many :batches, -> { distinct }, through: :aliquots
  has_many :resources, Resource.distinct_on_id, through: :aliquots
  has_many :resource_compounds, -> { distinct }, through: :resources, source: :compound
  has_many :aliquots_compound_links, through: :aliquots
  has_many :compound_links, -> { distinct }, through: :aliquots_compound_links
  has_many :compounds, -> { distinct }, through: :compound_links
  has_many :contextual_custom_properties, as: :context
  has_many :contextual_custom_properties_configs, through: :contextual_custom_properties
  has_many :aliquot_contextual_custom_properties, through: :aliquots, source: :contextual_custom_properties
  has_many :aliquot_contextual_custom_properties_configs,
           through: :aliquot_contextual_custom_properties, source: :contextual_custom_properties_config

  scope :stale, -> { joins(:stale_container) }
  scope :generated, -> { where.not(generated_by_run_id: nil) }
  scope :inbound, -> { where(status: "inbound") }

  # an unrealized container is a generated container that has NOT been executed upon by ANY instruction
  #
  # This scope doesn't work well with eager_loading due to it being 2 queries in 1
  scope :unrealized, -> { generated.where.not(id: self.joins(:instructions).merge(Instruction.completed)) }
  scope :realized, -> { joins(:instructions).generated.merge(Instruction.completed).group("containers.id") }

  VALID_PROPERTY_KEY = /^[^.,#_+\-@][^.,#]*$/

  STATUS_INBOUND             = "inbound"
  STATUS_AVAILABLE           = "available"
  STATUS_PENDING_DESTROY     = "pending_destroy"
  STATUS_DESTROYED           = "destroyed"
  STATUS_PENDING_RETURN      = "pending_return"
  STATUS_RETURNED            = "returned"
  STATUS_CONSUMABLE          = "consumable"
  STATUS_INBOUND_CONSUMABLE  = "inbound_consumable"
  STATUS_OUTBOUND_CONSUMABLE = "outbound_consumable"

  STATUSES = [
    STATUS_INBOUND,
    STATUS_AVAILABLE,
    STATUS_PENDING_DESTROY,
    STATUS_DESTROYED,
    STATUS_PENDING_RETURN,
    STATUS_RETURNED,
    STATUS_CONSUMABLE,
    STATUS_INBOUND_CONSUMABLE,
    STATUS_OUTBOUND_CONSUMABLE
  ]

  DESTROYABLE_STATUSES = [
    STATUS_PENDING_DESTROY,
    STATUS_AVAILABLE,
    STATUS_CONSUMABLE
  ]

  TRANSFER_BAD_STATUS = [
    STATUS_PENDING_DESTROY,
    STATUS_PENDING_RETURN,
    STATUS_DESTROYED,
    STATUS_RETURNED
  ]

  TRANSFER_BAD_RUN_STATUS = %w[in_progress accepted pending]

  validate :is_not_retired?, on: :create
  validate :properties_validator
  validates :container_type, presence: true
  validates :status, inclusion: { in: STATUSES, message: "%{ value } is not a valid container status (#{STATUSES})" }
  validates :current_mass_mg, numericality: { greater_than_or_equal_to: :empty_mass_mg },
            unless:                         -> { empty_mass_mg.nil? }
  validates :empty_mass_mg, numericality: { less_than_or_equal_to: :current_mass_mg },
            unless:                       -> { current_mass_mg.nil? }
  validates :label, format: { with: %r{\A[^/]*\z}, message: "Character '/' is not allowed" }
  validates :label, format: { with: %r{\A[^,]*\z}, message: "Comma is not allowed" }
  # to re-enable and update https://strateos.atlassian.net/browse/OX-1022
  # validates :barcode, format: { with: /\A[\w-]*\z/ }
  # validates :suggested_barcode, format: { with: /\A[\w-]*\z/ }
  validate :barcode_uniqueness
  validates_inclusion_of :cover,
                         in: ->(c) { c.container_type.acceptable_lids },
                         if: ->(c) { !c.cover.nil? }
  validates_presence_of :lab_id

  after_initialize lambda {
    self.status ||= STATUS_AVAILABLE if self.has_attribute?(:status)
  }

  before_validation lambda {
    unless barcode.blank?
      # defensive check before calling operation on barcode
      self.barcode = barcode.gsub(/[^[:print:]]/, '').strip
    end
    unless suggested_barcode.blank?
      # defensive check before calling operation on suggested_barcode
      self.suggested_barcode = suggested_barcode.gsub(/[^[:print:]]/, '').strip
    end
  }

  before_save lambda {
    if label and label.strip.empty?
      self.label = nil
    end
    if saved_change_to_label? and container_type.well_count == 1 and aliquots.count > 0
      aq = aliquots.first
      aq.update(name: label)
    end

    # If container barcode is set, device_id should not remain supply, changed to
    # outside instead.
    if !self.barcode.nil? && self.device_id == 'supply'
      self.device_id = 'outside'
    end

    # allows status changes to unset deleted_at
    if destroyed_conceptually? and status != STATUS_DESTROYED
      self.restore!
      # restore the shipment if it is deleted and has been destroyed
      self.shipment.restore if self.shipment&.deleted?
    end
  }

  after_save lambda {
    if self.saved_change_to_device_id? || self.saved_change_to_location_id? || self.saved_change_to_slot?
      attributes = {
        device_id:   self.device_id,
        slot:        self.slot,
        location_id: self.location_id
      }

      self.container_transfers.create(attributes)
    end

    if status == STATUS_RETURNED and !self.location_id.nil?
      self.update!(
        location_id: nil
      )
    end
  }

  # TODO: The location_id and position should be updated by LocationService
  before_destroy lambda {
    self.update!(
      status:      STATUS_DESTROYED,
      location_id: nil
    )
  }

  after_destroy lambda {
    if shipment && shipment.checked_in_at.nil? && shipment.containers.blank?
      shipment.destroy!
    end
  }

  after_commit lambda {
    container_destruction_request&.reindex(mode: :inline, refresh: :wait_for)
  }

  def properties_validator
    return if properties.nil?

    properties.each_key do |k|
      if !VALID_PROPERTY_KEY.match(k)
        errors.add(:properties, "invalid characters for property key: #{k}")
      end
    end
  end

  def self.full_json
    {
      only:    [ :id, :barcode, :suggested_barcode, :created_at, :deleted_at, :run_count, :test_mode,
                 :label, :location_id, :status, :storage_condition, :shipment_id,
                 :shipment_code, :expires_at, :properties, :contextual_custom_properties,
                 :cover, :container_type_id, :slot, :created_by, :orderable_material_component_id ],
      include: {
        generated_by_run: {
          only:    [ :id ],
          include: {
            project: {
              only: [ :id ]
            }
          },
          methods: []
        },
        aliquots:         Aliquot.mini_json,
        container_type:   ContainerType::FULL_JSON,
        device:           Device.full_json,
        location:         Location.short_json,
        organization:     {
          only:    [ :id, :name, :subdomain, :test_account ],
          include: {},
          methods: []
        },
        lab:              {
          only: [ :id, :name ]
        }
      },
      methods: [ :will_be_destroyed_at, :hazards ]
    }
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [ :row, :col ] }
  end

  def self.aliquots_json
    {
      only:    [ :id, :barcode, :suggested_barcode, :created_at, :deleted_at, :run_count, :test_mode,
                 :label, :location_id, :organization_id, :status, :storage_condition, :shipment_id,
                 :shipment_code, :expires_at, :cover, :slot, :container_type_id, :created_by, :properties ],
      include: {
        container_type:               ContainerType::FULL_JSON,
        aliquots:                     Aliquot.mini_json,
        contextual_custom_properties: ContextualCustomProperty::FULL_JSON
      },
      methods: [ :suggested_user_barcode ]
    }
  end

  def self.short_json
    {
      only:    [ :id, :barcode, :suggested_barcode, :created_at, :deleted_at, :test_mode, :label, :location_id,
                 :storage_condition, :status, :shipment_id, :shipment_code, :expires_at, :kit_request_id,
                 :organization_id, :cover, :container_type_id, :slot, :created_by ],
      include: {
        container_type: ContainerType::FULL_JSON,
        device:         Device.short_json,
        location:       Location.short_json,
        organization:   {
          only:    [ :id, :name, :subdomain ],
          include: {},
          methods: []
        }
      },
      methods: [ :aliquot_count ]
    }
  end

  def self.mini_json
    {
      only:    [ :id, :label, :location_id, :barcode, :suggested_barcode, :created_at, :deleted_at, :storage_condition,
                 :test_mode, :organization_id, :status, :shipment_id, :shipment_code, :expires_at,
                 :cover, :slot, :container_type_id, :created_by ],
      include: {
        container_type: ContainerType::SHORT_JSON
      },
      methods: [ :will_be_destroyed_at ]
    }
  end

  def search_data
    container_search_data.merge(aliquot_search_data)
  end

  def is_not_retired?
    if container_type&.is_retired?
      errors.add(:container_type, :retired, value: container_type_id)
    end
  end

  def container_search_data
    searchkick_as_json(Container.flat_json)
      .merge(
        container_type:               container_type.shortname,
        well_count:                   container_type.well_count,
        is_tube:                      container_type.is_tube,
        will_be_destroyed:            status == STATUS_AVAILABLE && !will_be_destroyed_at.nil?,
        tared_weight_mg:              tared_weight_mg,
        region_id:                    region_id,
        hazards:                      hazards,
        organization_name:            organization_name,
        contextual_custom_properties: to_key_val_array(contextual_custom_properties
                                                                 .map(&:to_hash)
                                                                 .reduce({}, :merge)),
        properties:                   to_key_val_array(properties).uniq,
        label:                        label
      )
  end

  def aliquot_search_data
    {
      aliquot_count:                        aliquots.size,
      aliquot_names:                        aliquots.map(&:name).uniq.compact,
      aliquot_volumes:                      aliquots.map(&:volume_ul).uniq.compact,
      aliquot_masses:                       aliquots.map(&:mass_mg).uniq.compact,
      aliquot_properties:                   aliquots.flat_map(&:properties_as_key_val_array).uniq,
      compound_link_ids:                    compound_links.map(&:id),
      batch_ids:                            batches.map(&:id).uniq,
      aliquot_contextual_custom_properties: to_key_val_array(aliquot_contextual_custom_properties
                                                               .map(&:to_hash)
                                                               .reduce({}, :merge)).uniq,
      compound_ids:                         all_compound_ids.uniq,
      compound_count:                       all_compound_ids.size
    }
  end

  def self.search_scoped(query, organization, options = {})
    self.search_all(query, options.deep_merge({
      query: {
        filtered: {
          filter: {
            terms: {
              organization_id: [ organization.id ]
            }
          }
        }
      }
    }))
  end

  def self.find_tiso_containers_within(location)
    Container.joins(location: :location_type)
             .where(location_types: { category: 'tiso_column' })
             .where("? = ANY (locations.parent_path || locations.id) ", location.id)
  end

  def self.find_verso_containers_within(location)
    Container.joins(location: :location_type)
             .where(location_types: { name: 'verso' })
             .where("? = ANY (locations.parent_path || locations.id) ", location.id)
  end

  def errors_for_location_validation
    LocationService.errors_for_location_validation(id)
  end

  def warnings_for_location_validation
    LocationService.warnings_for_location_validation id, location_id
  end

  def find_device_using_location
    if location_id.nil?
      return nil
    end

    # TODO: handle multiple devices being returned
    # This probably won't happen, but we should take the 'closest' device
    Device.where(location_id: location.path).first
  end

  def public_location_description
    if test_mode
      return 'N/A (test mode container)'
    end

    status_description =
      case status
      when STATUS_INBOUND
        "In transit to #{self&.lab&.operated_by&.name}."
      when STATUS_DESTROYED
        'Destroyed'
      when STATUS_RETURNED
        'Returned to you'
      else
        nil
      end

    if status_description
      status_description
    elsif !device_id.nil?
      'In device'
    elsif !location_id.nil?
      'In storage'
    else
      'In use'
    end
  end

  def aliquot_count
    self.aliquot_ids.size
  end

  def region_id
    region = self.location&.root
    region&.id
  end

  def container_type_shortname
    container_type.shortname
  end

  def aliquot_for_well(well_idx)
    robot_idx = container_type.robot_well(well_idx)
    return nil unless robot_idx

    a = aliquots.find_by_well_idx robot_idx.to_s
    if not a
      a           = aliquots.build
      a.volume_ul = 0
      a.well_idx  = robot_idx.to_s
    end
    a
  end

  def assign_current_mass_mg(empty_mass_mg, mass_mg = nil)
    if empty_mass_mg
      self.current_mass_mg = empty_mass_mg
      self.empty_mass_mg   = empty_mass_mg
    end
    if mass_mg && self.empty_mass_mg.present?
      empty_mass           = self.empty_mass_mg
      self.current_mass_mg = empty_mass + mass_mg
    end
  end

  def update_current_mass_mg(container_attrs, aliquots_attrs)
    if container_attrs[:container_type]&.is_tube
      empty_mass_mg = container_attrs[:empty_mass_mg]
      aliquot_attrs = aliquots_attrs&.values.present? && aliquots_attrs.values[0]
      mass_mg       = aliquot_attrs && aliquot_attrs[:mass_mg]
      self.assign_current_mass_mg(empty_mass_mg, mass_mg)
    end
  end

  def update_current_mass_mg_tubes_and_plates(container_attrs, aliquots_attrs)
    empty_mass_mg = container_attrs[:empty_mass_mg]
    if container_attrs[:container_type]&.is_tube
      aliquot_attrs_name = aliquots_attrs[0]&.values.present? && aliquots_attrs[0].values[0]
      mass_mg            = aliquot_attrs_name && aliquots_attrs[0][:mass_mg]
      self.assign_current_mass_mg(empty_mass_mg, mass_mg)
    else
      self.assign_current_mass_mg(empty_mass_mg, nil)
    end
  end

  def self.create_with_wells_unsafe(container_attrs, aliquots_attrs, organization)
    container     = Container.new
    bulk_aliquots = []

    ActiveRecord::Base.transaction do
      container.organization = organization
      container.update_current_mass_mg(container_attrs, aliquots_attrs)
      container.assign_attributes(container_attrs.except('id', 'empty_mass_mg').to_h)
      container.lab = Lab.find(container_attrs[:lab_id])
      container.save!

      aliquots_attrs.each do |well_idx, aq_attrs|
        aq          = container.aliquots.build
        aq.id       = Aliquot.generate_snowflake_id
        aq.well_idx = container.container_type.robot_well(well_idx)
        aq.assign_attributes(aq_attrs.except('id'))
        bulk_aliquots << aq
      end

      bulk_aliquots.each(&:run_bulk_import_callbacks)
      Aliquot.import!(bulk_aliquots)
    end

    # Reindex aliauots
    bulk_aliquots.each(&:reindex)

    # Ensure that the bulk imported aliquots are accurate
    container.aliquots.reload

    # Reindex the container, as aliquot callbacks were skipped during import
    container.reindex

    container
  end

  def serializable_hash(opts = {})
    opts = Container.full_json.merge(opts || {})
    super(opts.deep_dup)
  end

  def device_name=(data)
    self.device = data.nil? ? nil : Device.find_by_name!(data)
  end

  def make_effect(opts)
    AliquotEffect.new(
      {
        affected_container_id: id,
        affected_well_idx:     nil
      }.merge(opts)
    )
  end

  def all_runs_closed?
    runs.where.not(status: Run.closed_state_names()).pluck(:status).blank?
  end

  def barcode_uniqueness
    barcode = self.barcode
    if barcode.present? && !self.destroyed_conceptually? && self.lab.present?
      containers_with_same_barcode = Container
                                     .where(barcode: barcode, lab: self.lab.shared_ccs_labs)
                                     .where.not(id: self.id)
                                     .where.not(status: STATUS_DESTROYED)

      if containers_with_same_barcode.empty?
        return
      end

      claiming_container_already_exists = containers_with_same_barcode.count > 1
      if claiming_container_already_exists
        errors.add(:barcode, :taken, value: barcode)
      else
        container               = containers_with_same_barcode.first
        has_same_container_type = container.container_type == self.container_type

        ##
        # Once a container with the same barcode has been located, we validate the following conditions:
        #
        # 1. Claiming container status is 'inbound' or 'available'.
        # - The check-in process receives containers with status 'inbound'.
        # - The execution process receives containers with status 'available'.
        #
        # 2. Existing container has status consumable or outbound_consumable.
        #
        # 3. Consumable and claiming container have the same type.
        #
        # 4. If existing container status is outbound_consumable, it must have the same org as the claiming container.

        if [ STATUS_INBOUND, STATUS_AVAILABLE ].exclude?(self.status)
          errors.add(:barcode, :taken, value: barcode)
        elsif [ STATUS_CONSUMABLE, STATUS_OUTBOUND_CONSUMABLE ].exclude?(container.status)
          errors.add(:barcode, :taken, value: barcode)
        elsif !has_same_container_type
          errors.add(:barcode, :container_type_mismatch, value: barcode)
        elsif container.status == STATUS_OUTBOUND_CONSUMABLE && container.organization_id != self.organization_id
          errors.add(:barcode, :organization_mismatch, value: barcode)
        end
      end
    end
  end

  def ready_for_run
    [ STATUS_INBOUND, STATUS_AVAILABLE, STATUS_CONSUMABLE ].include?(status)
  end

  def inbound?
    status == STATUS_INBOUND
  end

  # Don't use the method name "destroyed?" as that overwrites
  # activerecord and causes issues with updating columns on a "destroyed"
  # container.
  def destroyed_conceptually?
    deleted_at or status == STATUS_DESTROYED
  end

  def update_container_and_destroy_consumable
    self.barcode = if self.barcode.present?
                     self.barcode
                   elsif self.suggested_user_barcode.present?
                     self.suggested_user_barcode
                   else
                     errors.add(:barcode, :barcode_required)
                     raise ActiveRecord::RecordInvalid.new(self)
                   end

    consumable = Container.where({ barcode: self.barcode, status: [ STATUS_CONSUMABLE, STATUS_OUTBOUND_CONSUMABLE ] })
                          .where.not(id: self.id).where(lab: self.lab.shared_ccs_labs).first

    aliquot_mass = self.aliquots&.first&.mass_mg
    if consumable&.empty_mass_mg.present? && self.empty_mass_mg.present?
      self.current_mass_mg -= self.empty_mass_mg
      self.empty_mass_mg = consumable.empty_mass_mg
      self.current_mass_mg += self.empty_mass_mg
    elsif consumable&.empty_mass_mg.present?
      self.assign_current_mass_mg(consumable.empty_mass_mg, aliquot_mass)
    end
    ActiveRecord::Base.transaction do
      self.save!
      consumable&.destroy!
    end
  end

  def update_consumable_with_container(container_params, aliquots_params)
    ActiveRecord::Base.transaction do
      bulk_aliquots = []
      aliquots_params.each do |aliquot_params|
        aliquot = self.aliquots.find_by(well_idx: aliquot_params[:well_idx])
        if aliquot.nil?
          aliquot = Aliquot.new(aliquot_params.merge(container_id: self.id))
          bulk_aliquots << aliquot
        else
          aliquot.update!(aliquot_params)
        end
      end
      Aliquot.import!(bulk_aliquots) unless bulk_aliquots.empty?
      unless self.empty_mass_mg.nil?
        self.current_mass_mg = self.empty_mass_mg + self.aliquots.sum(:mass_mg)
      end
      self.update!(**container_params, current_mass_mg: self.current_mass_mg)
    end
  end

  def checkin(current_admin, new_location_id = nil)
    self.location_id = new_location_id if !new_location_id.nil?

    if self.location_id.nil? or self.location_id.empty?
      self.errors.add(:location_id, :blank, value: self.label)
      raise ActiveRecord::RecordInvalid.new(self)
    end

    ActiveRecord::Base.transaction do
      self.update!(
        location_id: self.location_id,
        status:      STATUS_AVAILABLE
      )

      if shipment&.all_containers_checkedin?
        shipment.checkin!(current_admin)
      end

      Run.update_can_start(runs)
    end
  end

  def request_destroy(requester)
    unless all_runs_closed?
      return "Container has pending runs and can't be destroyed."
    end

    begin
      transaction do
        ContainerDestructionRequest.create!(user: requester, container: self)
        if self.status == STATUS_INBOUND
          self.destroy!
        else
          self.update!(status: STATUS_PENDING_DESTROY)
        end
      end
    rescue ActiveRecord::ActiveRecordError => e
      Bugsnag.notify(e.message)
      return "Container destruction failed."
    end
    return nil
  end

  def transfer(organization, lab = nil)
    ActiveRecord::Base.transaction do
      self.update(organization_id: organization.id)
      self.update(lab_id: lab.id) unless lab.nil?
    end

    self.reindex
  end

  def undo_destroy
    begin
      transaction do
        self.container_destruction_request.try(:destroy)

        status = if self.shipment && self.shipment.checked_in_at.nil?
                   STATUS_INBOUND
                 else
                   STATUS_AVAILABLE
                 end

        self.update!(status: status)
      end
    rescue ActiveRecord::ActiveRecordError => e
      Bugsnag.notify(e.message)
      return "Undo destruction failed."
    end
    nil
  end

  def confirm_destroy
    # check if it's a stock container
    if organization.present?
      # check status
      if not DESTROYABLE_STATUSES.include?(status)
        errors.add("base", "Only available, consumable or pending destroy containers can be destroyed.")
        return
      end
      # check runs
      if not all_runs_closed?
        errors.add("base", "Container has pending runs and can't be destroyed.")
        return
      end
    end

    begin
      self.destroy!
    rescue ActiveRecord::ActiveRecordError => e
      Rails.logger.error(e.message)
      errors.add("base", "Container destruction failed.")
    end
  end

  def prepare_for_shipment
    self.update(status: STATUS_PENDING_RETURN)
  end

  def set_shipped
    self.update(status: STATUS_RETURNED, location_id: nil)
  end

  def workcell
    root_location = (self.location.ancestors[0] or self.location)
    location_type = LocationType.find(root_location.location_type_id)
    if location_type.category != 'workcell'
      raise FindWorkcellError, self.id
    else
      root_location.name
    end
  end

  def will_be_destroyed_at
    self.stale_container&.will_be_destroyed_at
  end

  def self.all_provision_containers(resource_id, min_quantity = 0, include_plates = false,
                                    include_expired = false, measurement_key_unit = 'volume_ul', lab_id = nil,
                                    supplier_id = nil, vendor_id = nil, concentration = nil)
    relation = Container.includes(:aliquots, :container_type)
                        .where(organization_id: nil)
                        .where(aliquots: { resource_id: resource_id })

    if supplier_id.present? || vendor_id.present?
      omcs = OrderableMaterialComponent.filter_by_resource_supplier_vendor(resource_id, supplier_id, vendor_id)
      if concentration.present?
        omcs = omcs.filter do |omc|
          if omc.material_component.concentration.present?
            omc_concentration_obj       = omc.material_component.concentration
            converted_omc_concentration = RubyUnits::Unit.new(omc_concentration_obj.quantity,
                                                              omc_concentration_obj.unit) >> "M"
            concentration == converted_omc_concentration.scalar
          else
            false
          end
        end
      end
      relation = relation.where("orderable_material_component_id IN (?)", omcs.pluck(:id))
    end

    if !lab_id.nil?
      relation = relation.where(lab_id: lab_id)
    end

    if !include_expired
      relation = relation.where("expires_at is null OR expires_at > ?", Time.now)
    end

    if min_quantity.present?
      relation = relation.where("aliquots.#{measurement_key_unit} > ?", min_quantity)
    end

    if !include_plates
      # restrict to just tubes
      relation = relation.where(container_types: { is_tube: true })
    end

    relation
  end

  def self.all_orderable_material_component_containers(orderable_material_component_id)
    Container.includes(:aliquots)
             .where(organization_id:                 nil,
                    test_mode:                       false,
                    orderable_material_component_id: orderable_material_component_id)
             .where("expires_at is null OR expires_at > ?", Time.now)
  end

  # Hack to make it easier for admins to bulk create containers
  # from csv and tag them with a suggested barcode which
  # will get validated during shipment checkin. See WEB-88
  def suggested_user_barcode
    if self.suggested_barcode.present?
      return self.suggested_barcode
    end

    aliquot = aliquots.take
    if !aliquot.nil? && !aliquot.properties.nil?
      aliquot.properties['InternalSuggestedBarcode']
    else
      nil
    end
  end

  def tared_weight_mg
    empty_mass_mg || nil
  end

  def organization_name
    organization&.name
  end

  def set_compound_links(compound_links)
    aliquots.each do |aliquot|
      aliquot.set_composition(compound_links)
    end
  end

  def has_same_container_type?(other_contaienr)
    self.container_type_id == other_contaienr.container_type_id
  end

  # get a list of hazards for the container
  def hazards
    hazards_labels = [ "unknown",
                       "flammable",
                       "oxidizer",
                       "strong_acid",
                       "water_reactive_nucleophile",
                       "water_reactive_electrophile",
                       "general",
                       "peroxide_former",
                       "strong_base" ]
    compounds.pluck(*hazards_labels).transpose.map(&:any?).zip(hazards_labels).select { |e| e[0] }.transpose.last || []
  end

  def aliquot_mass_mg
    (current_mass_mg || 0) - (empty_mass_mg || 0)
  end

  def properties_merged_with_outs_of(run)
    container_from_outs_of(run).properties
  end

  def cc_properties_merged_with_outs_of(run)
    run.changed_contextual_custom_properties(container_ids: [ id ])[id] || []
  end

  def container_from_outs_of(run)
    run.changed_containers(container_ids: [ id ]).find { |container| container.id == id } || self
  end

  def self.create_with_attributes(container_params, aliquot_params, pundit_user)
    container  = Container.new(container_params)
    barcode    = container[:barcode]
    consumable = nil
    if barcode.present?
      consumable = Container.find_by(lab_id: container.lab_id, container_type_id: container.container_type_id,
                                     status: STATUS_CONSUMABLE, barcode: barcode)
    end
    if consumable.present?
      ContainerPolicy.new(pundit_user, consumable).update?
      consumable.update_consumable_with_container(container_params, aliquot_params)
      return { updated: consumable.reload }
    else
      container.created_by = pundit_user.user.id
      ContainerPolicy.new(pundit_user, container).create?
      aliquots = []
      aliquot_params.each do |p|
        aliquot           = Aliquot.new(p)
        aliquot.container = container
        aliquots << aliquot
      end

      Searchkick.callbacks(false) do
        ActiveRecord::Base.transaction do
          container.save!
          aliquots.each(&:run_bulk_import_callbacks)
          Aliquot.import!(aliquots)
        end
      end

      # Reindex aliquots
      aliquots.each(&:reindex)

      # Reindex container
      container.reindex
    end
    return { created: container }
  end

  def self.bulk_link_shipment_and_codes(container_ids, shipment_id)
    ActiveRecord::Base.transaction do
      code_count     = container_ids.size
      shipment_codes = Shipment.generate_uniq_shipment_codes(code_count)
      Container.find(container_ids).each_with_index.map do |container, index|
        container.update!({ shipment_id: shipment_id, shipment_code: shipment_codes[index] })
      end
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def self.bulk_link_shipment(container_ids, shipment_id)
    ActiveRecord::Base.transaction do
      Container.find(container_ids).each do |container|
        container.update!(shipment_id: shipment_id)
      end
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def all_compound_ids
    compounds.map(&:id) | resource_compounds.map(&:id)
  end
end

class ContainerError < StandardError
end

class FindWorkcellError < ContainerError
  def initialize(id)
    super
    @id = id
  end

  def message
    "Container #{@id} is not in a workcell."
  end
end
