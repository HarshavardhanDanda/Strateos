class Location < ApplicationRecord
  has_snowflake_id('loc')

  audit_trail

  belongs_to :location_type
  belongs_to :parent, class_name: "Location"
  belongs_to :lab
  has_many   :children, class_name: "Location", foreign_key: "parent_id"
  has_many   :containers

  delegate :plate_rack_cell?, to: :location_type
  delegate :tiso_column?, to: :location_type
  delegate :box?, to: :location_type

  validates :location_type, presence: true
  validates :height_mm, presence: true, if: :plate_rack_cell?
  validates :position, presence: true, if: :tiso_column?
  validate  :blacklist_must_be_acceptable_hazards

  # Keep path and merged properties synced. We recalculate this location's
  # merged_properties in `before_save` so that the updated properties all hit
  # the database in a single UPDATE, but update the children in `after_save` so
  # that they can refer to the final `merged_properties` value.
  before_save :recalculate
  after_save :update_children

  scope :where_location_category, lambda { |category|
    joins(:location_type).where(location_types: { category: category })
  }

  scope :where_location_type_by_name, lambda { |name|
    joins(:location_type).where(location_types: { name: name })
  }

  scope :where_container_type, lambda { |container_type|
    joins(location_type: :container_types).where(container_types: { id: container_type })
  }

  scope :unoccupied, lambda {
    includes(:containers)
      .where(containers: { id: nil })
  }

  scope :with_ancestor, lambda { |id|
    where(":id = ANY (parent_path)", id: id)
  }

  HAZARDS = Set.new([
    'unknown',
    'flammable',
    'oxidizer',
    'strong_acid',
    'water_reactive_nucleophile',
    'water_reactive_electrophile',
    'general',
    'peroxide_former',
    'strong_base'
  ])

  def blacklist_must_be_acceptable_hazards
    if !is_acceptable_hazards(blacklist)
      errors.add(:blacklist, "must be a subset of #{HAZARDS.to_a}")
      return
    end

    # Check that containers are allowed inside destination location
    if changes.has_key?('parent_id')
      destination_blacklist = Location.find(parent_id).all_blacklisted_hazards
      hazardous_container_ids = containers_deep_with_hazards(destination_blacklist)

      if !hazardous_container_ids.empty?
        errors.add(:parent_id, "hazardous containers #{hazardous_container_ids} are not allowed in this location")
        return
      end
    end

    # Location cannot have blacklisted hazard if already containing such hazardous compound
    if changes.has_key?('blacklist')
      hazardous_container_ids = containers_deep_with_hazards(blacklist)

      if !hazardous_container_ids.empty?
        errors.add(:blacklist, "location contains containers #{hazardous_container_ids} with hazardous compounds")
      end
    end
  end

  def ancestors
    Location.find(parent_path).sort_by { |l| parent_path.index l.id }
  end

  def root
    return nil if parent_path.nil? || parent_path.empty?

    root_id = parent_path.first
    return Location.find(root_id)
  end

  def is_region?
    location_type_category == 'region'
  end

  def descendants
    Location.with_ancestor(id)
  end

  def ancestors_as_json_flat
    # used with json serializers so that we shallow fetch location's ancestors.
    # NOTE: using this as as_json(methods: [:ancestors_as_json_flat]) will write the field in json
    # with that name, and will need to be manually changed to :ancestors.
    ancestors.as_json(Location.flat_json)
  end

  # returns any containers within self or descendants
  def containers_deep
    self.containers + descendants.includes(:containers).flat_map(&:containers)
  end

  def location_type_category
    location_type.category
  end

  def location_type_name
    location_type.name
  end

  def update_children
    return unless saved_change_to_parent_path? or saved_change_to_merged_properties?
    children.each(&:save!)
  end

  def name
    # dynamically generate location leaf node names (tube cell and rack cell)
    if row and col
      if location_type.plate_rack_cell?
        # converts to col number row letter i.e. row 0 col 1 => 2A
        "#{col + 1}#{(65 + row).chr}"
      else
        "Row: #{row + 1} Col: #{col + 1}"
      end
    else
      self[:name]
    end
  end

  def path
    parent_path + [ id ]
  end

  def human_path
    name_path.join(" --> ")
  end

  def name_path
    ancestors.map(&:name) + [ name ]
  end

  # destroy self and all descendants
  def destroy_deep!
    descendants.sort_by { |d| -d.parent_path.size }.append(self).each(&:destroy)
  end

  def acceptable_container_types
    location_type.container_types.map(&:id)
  end

  def acceptable_location_type_categories
    location_type.location_type_categories
  end

  def is_acceptable_hazards(blacklist)
    Set.new(blacklist).subset? Compound::HAZARDS
  end

  def ancestor_blacklist
    ancestors.flat_map(&:blacklist).uniq
  end

  def all_blacklisted_hazards
    (ancestor_blacklist + blacklist).uniq
  end

  def containers_deep_with_hazards(hazards)
    return [] if hazards.blank?

    containers_deep.select { |container|
      CompoundServiceFacade::GetCompounds.call(
        { compound_id: container.compounds&.ids, flags: hazards }, CompoundServiceFacade::Scope::ALL
      ).present?
    }.map(&:id)
  end

  def self.children_deep(location_id)
    # TODO: Use postgres recursive queries
    locations    = []
    location_ids = [ location_id ]

    depth = 2
    (0...depth).each do
      children = Location.where(parent_id: location_ids)
      locations.concat(children)
      location_ids = children.map(&:id)
    end

    locations
  end

  # Recalculate the `parent_path` and `merged_properties` fields according to
  # the parent.
  def recalculate
    self.parent_path = parent.try(:path) || []
    self.merged_properties = (parent.try(:merged_properties) || {}).merge(properties)
    self.blacklist = self.all_blacklisted_hazards
  end

  # Queries by testing equality on fields and hstore keys
  # i.e. matching({location_type_id: 10}, {'temperature': 20})
  def self.matching(name, field_clauses, prop_clauses)
    fields_not_usable = (field_clauses.nil? or field_clauses.empty?)
    props_not_usable  = (prop_clauses.nil?  or prop_clauses.empty?)

    return Location.none if name.nil? and fields_not_usable and props_not_usable

    locations = Location.all
    unless name.nil?
      locations = locations.where("name ilike ?", "%#{name}%")
    end
    unless fields_not_usable
      locations = locations.where(field_clauses.to_hash)
    end
    unless props_not_usable
      prop_clauses.each do |k, v|
        safe_key   = ActiveRecord::Base.connection.quote(k)
        safe_value = ActiveRecord::Base.connection.quote(v.to_s)

        locations = locations.where("properties -> #{safe_key} = #{safe_value}")
      end
    end

    locations
  end

  def serializable_hash(opts = {})
    opts = Location.full_json.merge(opts || {})
    super(opts)
  end

  def to_s
    "Location(#{id}) #{name} LocationType(#{location_type.category} #{location_type.name})"
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def total_plates_height
    containers.inject(0) do |sum, plate|
      raise "Location #{id} has plate without a height #{plate.id}" if plate.height_mm.nil?
      sum + plate.lidded_plate_height
    end
  end

  def self.full_json
    {
      only: [
        :id, :parent_id, :name, :position, :row, :col,
        :properties, :created_at, :updated_at,
        :merged_properties, :parent_path, :blacklist, :lab_id
      ],
      include: {
        location_type: LocationType.full_json,
        ancestors: {
          only: [ :id, :name, :position, :parent_id ],
          include: {}
        },
        children: Location.short_json,
        containers: Container.short_json
      },
      methods: [ :human_path, :ancestor_blacklist ]
    }
  end

  def self.short_json
    {
      only: [
        :id, :parent_id, :name, :position, :row, :col,
        :properties, :created_at, :updated_at,
        :merged_properties, :parent_path, :lab_id
      ],
      include: {
        location_type: LocationType.full_json,
        ancestors: {
          only: [ :id, :name, :position, :parent_id ],
          include: {}
        }
      },
      methods: []
    }
  end

end
