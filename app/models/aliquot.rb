class Aliquot < ApplicationRecord
  has_snowflake_id('aq')
  acts_as_paranoid
  audited associated_with: :container
  include HashUtil

  belongs_to :created_by_run, class_name: "Run"
  belongs_to :container, -> { with_deleted }
  has_one :container_type, through: :container
  belongs_to :resource
  has_many :aliquot_resource_links

  validates_presence_of :container
  validates :volume_ul, numericality: true, allow_nil: true
  validates :mass_mg, numericality: true, allow_nil: true
  validates :name, format: { with: %r{\A[^/]*\z}, message: "Character '/' is not allowed" }
  validates :well_idx, numericality: true, presence: true
  validate :properties_validator

  # CompoundLink through association
  has_many :aliquots_compound_links, class_name: :AliquotCompoundLink, dependent: :destroy, autosave: true
  has_many :compound_links, through: :aliquots_compound_links
  has_many :minimal_compounds, -> { minimal_properties }, through: :compound_links, source: :compound
  has_many :batches, through: :aliquots_compound_links

  has_many :contextual_custom_properties, as: :context
  has_many :contextual_custom_properties_configs, through: :contextual_custom_properties

  # Disallow specific characters at the start and the period after that.
  # https://discuss.elastic.co/t/special-characters-in-field-names/10658/4
  # https://discuss.elastic.co/t/illegal-characters-in-elasticsearch-field-names/17196
  VALID_PROPERTY_KEY = /^[^.,#_+\-@][^.,#]*$/

  def properties_validator
    return if properties.nil? || !saved_change_to_properties?

    properties.each_key do |k|
      if !VALID_PROPERTY_KEY.match(k)
        errors.add(:properties, "invalid characters for property #{k}")
      end
    end
  end

  searchkick(batch_size: 200,
             merge_mappings: true,
             word_middle: [ :name, :resource_name ],
             callbacks: :queue)

  scope :search_import, -> { includes(:container, :resource) }
  scope :minimal_properties, -> { select(:id, :container_id).with_deleted }

  def aliquot_effects
    AliquotEffect.where(
      'affected_container_id = ? and (affected_well_idx is null or affected_well_idx = ?)',
      container_id, well_idx
    ).order('created_at desc')
  end

  before_save lambda {
    if name&.strip&.empty?
      self.name = nil
    end

    if should_set_solid_m_moles?
      single_aliquot_compound_link = aliquots_compound_links.first
      compound_molecular_weight = single_aliquot_compound_link.compound_link.molecular_weight
      m_moles = AliquotCompoundLink.calculate_millimoles_from_mass(mass_mg, compound_molecular_weight)
      single_aliquot_compound_link.m_moles = m_moles
    end
  }

  after_save lambda {
    update_container_current_mass
  }

  def resource=(resource)
    # If current resource is not equal to new resource, set new resource and generate
    # aliquot resource link, which will be saved when the aliquot is saved
    # or when bulk importing aliquots with recursive=true.
    if resource != self.resource
      now = Time.now
      aliquot_resource_links.build(id: AliquotResourceLink.generate_snowflake_id,
                                   resource: resource,
                                   created_at: now)
      self[:resource_id_last_changed_at] = now
    end
    super(resource)
  end

  after_commit lambda {
    if Searchkick.callbacks?
      container.reindex
    end
  }

  def self.full_json
    {
      only: [ :id, :name, :volume_ul, :well_idx, :properties, :created_at,
              :organization_id, :lot_no, :mass_mg ],
      include: {
        container: Container.short_json,
        resource: Resource.full_json
      },
      methods: [ :resource_age, :status ]
    }
  end

  def self.short_json
    {
      only: [ :id, :name, :volume_ul, :well_idx, :properties, :created_at,
              :organization_id, :container_id, :lot_no, :mass_mg ],
      include: {
        container: Container.short_json,
        resource: Resource.short_json
      },
      methods: [ :resource_age ]
      # TODO: fetching these takes a prehibitively long time, but it would be
      # great to show this data in the aliquot list. Probably this should be
      # denormalized.
      # methods: [:status]
    }
  end

  def self.mini_json
    {
      only: [ :id, :name, :volume_ul, :well_idx, :properties, :created_at,
              :organization_id, :container_id, :lot_no, :mass_mg ],
      include: {
        resource: Resource.short_json,
        aliquots_compound_links: AliquotCompoundLink.flat_json,
        contextual_custom_properties: ContextualCustomProperty::FULL_JSON
      },
      methods: []
    }
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def should_index?
    container.present?
  end

  def properties_as_key_val_array
    to_key_val_array(properties)
  end

  def search_data
    searchkick_as_json(
      only: [ :id, :name, :created_at, :organization_id, :container_id ],
      include: {},
      methods: []
    ).merge(
      "resource_name": resource.try(:name),
      "organization_id": container.organization_id
    )
  end

  def add_properties=(props)
    self.properties = {} if self.properties.nil?
    props.each do |prop|
      self.properties[prop['key']] = prop['value']
    end
    self.properties_will_change!
  end

  def delete_properties=(props)
    self.properties = {} if self.properties.nil?
    props.each do |prop|
      self.properties.delete(prop)
    end
    self.properties_will_change!
  end

  def update_container_current_mass
    # check if some update happened to mass_mg and then update current_mass_mg of container accordingly
    # Note - this is only for tubes, for plates its more complex as each aliquot can have mass
    is_mass_updated = !container.empty_mass_mg.nil? &&
                      !self.mass_mg.nil? &&
                      container.current_mass_mg != container.empty_mass_mg + self.mass_mg
    if container.container_type.is_tube && is_mass_updated
      container.current_mass_mg = container.empty_mass_mg + (self.mass_mg || 0)
      container.save!
    end
  end

  def status
    active_refs = Ref.joins(:run)
                     .where(refs: { container_id: container.id }, runs: { completed_at: nil })
                     .where.not(runs: { started_at: nil })

    if active_refs.any?
      'active'
    else
      'passive'
    end
  end

  def nearest_resource
    self.aliquot_resource_links.order(created_at: :desc).first
  end

  def resource_age
    return "?" if self.resource_id_last_changed_at.nil?

    instructions = Instruction.where("? = ANY(aliquot_ids)", self.id)
                              .where("executed_at > ?", self.resource_id_last_changed_at)
                              .count

    days = (Date.today - self.resource_id_last_changed_at.to_date).to_i

    "#{days}d, #{instructions}i"
  end

  def organization
    container.organization
  end

  def make_effect(opts)
    AliquotEffect.new(
      {
        affected_container_id: container_id,
        affected_well_idx: well_idx
      }.merge(opts)
    )
  end

  def make_liquid_sensing_effect(aliquot, calibrated_volume_ul, adjusted_volume_ul, instruction: nil)
    make_effect(
      effect_type: 'liquid_sensing',
      effect_data: {
        sensed_aliquot: {
          container_id: aliquot.try(:container_id),
          well_idx: aliquot.try(:well_idx)
        },
        calibrated_volume_ul: calibrated_volume_ul.try(:to_f), # TODO[alc] Remove to_f once UI supports String
        adjusted_volume_ul: adjusted_volume_ul.try(:to_f) # TODO[alc] Remove to_f once UI supports String
      },
      generating_instruction: instruction
    )
  end

  def make_manual_adjustment_effect(user_id, adjusted_volume_ul: nil, adjusted_mass_mg: nil)
    make_effect(
      effect_type: 'manual_adjustment',
      effect_data: {
        adjusted_volume_ul: adjusted_volume_ul.try(:to_f), # TODO[alc] Remove to_f once UI supports String
        adjusted_mass_mg: adjusted_mass_mg.try(:to_f), # TODO[alc] Remove to_f once UI supports String
        adjuster_id: user_id
      }.compact,
      generating_instruction: nil
    )
  end

  def make_transfer_effect(effect_type:, mass_mg: nil, volume_ul: nil,
                           to_aliquot: nil, from_aliquot: nil, from_effect: nil,
                           is_stock: false, instruction: nil)
    case effect_type
    when 'liquid_transfer_in'
      make_effect(
        effect_type: effect_type,
        effect_data: {
          source: {
            container_id: from_aliquot.try(:container_id),
            well_idx: from_aliquot.try(:well_idx),
            is_stock: is_stock,
            at_effect_id: from_effect.try(:id)
          },
          volume_ul: volume_ul.try(:to_f) # TODO[alc] Remove to_f once UI supports String
        },
        generating_instruction: instruction
      )
    when 'liquid_transfer_out'
      make_effect(
        effect_type: effect_type,
        effect_data: {
          destination: {
            container_id: to_aliquot.try(:container_id),
            well_idx: to_aliquot.try(:well_idx)
          },
          volume_ul: volume_ul.try(:to_f) # TODO[alc] Remove to_f once UI supports String
        },
        generating_instruction: instruction
      )
    when 'solid_transfer_in'
      make_effect(
        effect_type: effect_type,
        effect_data: {
          source: {
            container_id: from_aliquot.try(:container_id),
            well_idx: from_aliquot.try(:well_idx),
            at_effect_id: from_effect.try(:id)
          },
          mass_mg: mass_mg
        },
        generating_instruction: instruction
      )
    when 'solid_transfer_out'
      make_effect(
        effect_type: effect_type,
        effect_data: {
          destination: {
            container_id: to_aliquot.try(:container_id),
            well_idx: to_aliquot.try(:well_idx)
          },
          mass_mg: mass_mg
        },
        generating_instruction: instruction
      )
    end
  end

  # Given an array of [[container_id, well_idx], ...] efficiently finds aliquots
  #
  #   well_idx can be human or robot index
  #
  # Returns mapping from original pair to found aliquot
  def self.find_aliquots_from_ct_well_pairs(pairs)
    if pairs.empty?
      return []
    end

    container_ids = pairs.map { |p| p[0] }.uniq
    containers = Container.with_deleted.find(container_ids)
    container_types = ContainerType.find(containers.map(&:container_type_id).uniq)

    ctid_to_ctype = {}
    containers.each do |container|
      found = container_types.find { |ctype| ctype.id == container.container_type_id }
      ctid_to_ctype[container.id] = found
    end

    # cache mapping from pair to robot well
    robot_cache = {}

    # convert the human wells to robot wells sql claues.
    clauses = pairs.map do |pair|
      container_id = pair[0]
      ctype = ctid_to_ctype[container_id]
      robot_well = ctype.robot_well(pair[1])

      robot_cache[pair] = robot_well

      Aliquot.with_deleted.where(container_id: container_id, well_idx: robot_well)
    end

    # join all of the clauses with OR
    # Maybe this will be faster with an expliict IN with tuples, though I don't think rails natively supports.
    query = clauses.reduce(&:or)

    aliquots = query.to_a

    pairs.map { |pair|
      robot_well = robot_cache[pair]
      aliquot = aliquots.find { |a| a.container_id == pair[0] && a.well_idx == robot_well }

      [ pair, aliquot ]
    }.to_h
  end

  def add_aliquot_compound_link(acl_property)
    record = { aliquot_id: self.id,
               compound_link_id: acl_property[:compound_link_id], concentration: acl_property[:concentration],
               solubility_flag: acl_property[:solubility_flag] }

    self.aliquots_compound_links.build(record)
  end

  # Overwrites aliquot composition
  def set_composition(new_compound_links)
    transaction do
      self.aliquots_compound_links.delete_all
      self.compound_links = new_compound_links
    end
    # reindex so we can recalculate our compound links
    container.reindex
  end

  def remove_unreferenced_acls(compound_link_ids)
    self.aliquots_compound_links = self.aliquots_compound_links.where(compound_link_id: compound_link_ids)
  end

  # Overwrites aliquot composition with aliquot compound link properties
  def set_composition_with_properties(aliquot_compound_links_properties)
    transaction do
      requested_compound_link_ids = aliquot_compound_links_properties.pluck(:compound_link_id)
      remove_unreferenced_acls(requested_compound_link_ids)

      aliquot_compound_links_properties.map(&:with_indifferent_access).each do |acl_property|
        acl = self.aliquots_compound_links.find_by(compound_link_id: acl_property[:compound_link_id])
        if acl.present?
          acl.update!(concentration: acl_property[:concentration], solubility_flag: acl_property[:solubility_flag])
        else
          self.add_aliquot_compound_link(acl_property)
        end
      end
    end
    # reindex so we can recalculate our compound links
    if Searchkick.callbacks?
      container.reindex
    end
  end

  # Appends compound links to our composition by id
  def add_compound_links_by_id(compound_link_ids)
    # Use upsert lib so that we can avoid inserting duplicates
    Upsert.batch(AliquotCompoundLink.connection, AliquotCompoundLink.table_name) do |upsert|
      compound_link_ids.each do |link_id|
        record = { aliquot_id: self.id, compound_link_id: link_id }
        upsert.row(record, {})
      end
    end

    if Searchkick.callbacks?
      container.reindex
    end
  end

  # Appends resources to our composition by id
  def add_resource_by_id(resource_ids)
    if resource_ids.any?
      resource_ids.each do |resource_id|
        AliquotResourceLink.find_or_create_by(aliquot: self, resource_id: resource_id)
      end
    end

    if Searchkick.callbacks?
      container.reindex
    end
  end

  def serializable_hash(opts = {})
    opts = Aliquot.short_json.merge(opts || {})
    super(opts)
  end

  def self.all_permanent
    self.joins :resource
  end

  def subscriber_ids
    [ self.id ]
  end

  def name_from_outs_of(run)
    aliquot_from_outs_of(run).name
  end

  def properties_merged_with_outs_of(run)
    aliquot_from_outs_of(run).properties
  end

  def hazards
    compound_links.flat_map(&:flags).uniq
  end

  def cc_properties_merged_with_outs_of(run)
    run.changed_contextual_custom_properties(container_ids: [ container_id ])[id] || []
  end

  # As default value for volume is zero so if the aliquot consist mass and zero or nil volume, it should
  # be considered as solid aliquot
  def is_solid_aliquot?
    (volume_ul.nil? || volume_ul.zero?) && (mass_mg.present? && mass_mg.nonzero?)
  end

  # It will check if an single compound being added to an empty solid aliquot
  # OR if mass is being updated for solid aliquot consisting single compound
  def should_set_solid_m_moles?
    has_exact_one_compound = aliquots_compound_links.length == 1
    is_empty_aliquot = has_exact_one_compound && aliquots_compound_links.first.new_record?
    is_mass_updated = changes_to_save['mass_mg'].present?
    has_exact_one_compound && is_solid_aliquot? && (is_mass_updated || is_empty_aliquot)
  end

  private

  def aliquot_from_outs_of(run)
    run.changed_aliquots(container_ids: [ container_id ]).find { |aliquot| aliquot.id == id } || self
  end

end
