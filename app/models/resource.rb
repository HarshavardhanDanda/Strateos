class Resource < ApplicationRecord
  self.inheritance_column = :kind

  has_snowflake_id('rs')
  acts_as_paranoid

  searchkick(word_start: [ :name, :id ],
             word_middle: [ :name, :material_name, :id ],
             batch_size: 200,
             callbacks: :async)

  has_many :aliquot_resource_links
  has_many :aliquots
  belongs_to :organization
  has_many :kit_items
  has_many :kits, through: :kit_items
  has_many :material_components
  has_many :materials, through: :material_components
  has_many :mixture_components, as: :mixable
  belongs_to :compound
  validate :validate_compound_kind
  validates :purity, numericality: { greater_than_or_equal_to: 0,  less_than_or_equal_to: 100 }, allow_nil: true

  KINDS = [
    'Reagent',
    'ChemicalStructure',
    'NucleicAcid',
    'Protein',
    'Cell',
    'Virus',
    'Solvent'
  ].freeze

  STORAGE_CONDITIONS = [
    'ambient',
    'cold_4',
    'cold_20',
    'cold_80'
  ].freeze

  SENSITIVITIES = [
    'Temperature',
    'Light',
    'Air',
    'Humidity'
  ].freeze

  validates_presence_of :name
  validates_inclusion_of :kind, in: KINDS
  validates_inclusion_of :storage_condition, in: STORAGE_CONDITIONS
  validate :validate_sensitivities

  scope :reagents, -> { where(kind: "Reagent") }
  scope :chemical_structures, -> { where(kind: "ChemicalStructure") }
  scope :nucleic_acids, -> { where(kind: "NucleicAcid") }
  scope :proteins, -> { where(kind: "Protein") }
  scope :cells, -> { where(kind: "Cell") }
  scope :viruses, -> { where(kind: "Virus") }
  scope :solvents, -> { where(kind: "Solvent") }

  before_destroy :check_for_material_components

  def check_for_material_components
    if !material_components.empty?
      errors.add(
        :base,
        "Cannot destroy resource because the following material_components reference it:
        #{material_components.map(&:id).to_sentence}"
      )
      throw(:abort)
    else
      true
    end
  end

  def self.full_json
    {
      only: [ :id, :name, :kind, :description, :design, :properties,
             :organization_id, :storage_condition, :sensitivities, :purity, :compound_id ],
      include: {
        material_components: {
          only: [ :id ],
          include: {
            material: {
              only: [ :id, :name ],
              include: {},
              methods: []
            }
          },
          methods: []
        },
        compound: Compound.flat_json
      },
      methods: [ :metadata ]
    }
  end

  def self.short_json
    {
      only: [ :id, :name, :description, :kind, :properties,
             :organization_id, :storage_condition, :sensitivities, :purity, :compound_id ],
      include: {
        material_components: {
          only: [],
          include: {
            material: {
              only: [ :id, :name ],
              include: {},
              methods: []
            }
          },
          methods: []
        },
        compound: Compound.flat_json
      },
      methods: [ :metadata ]
    }
  end

  def self.mini_json
    {
      only: [ :id, :name, :description, :kind, :storage_condition, :sensitivities, :purity, :compound_id ],
      include: {}
    }
  end

  def metadata
    {}
  end

  def maybe(field, alt = nil)
    self.design[field] or alt
  end

  def aliquot_ids
    Aliquot.where(resource_id: self.id).pluck(:id)
  end

  def add_properties=(props)
    props.each do |prop|
      self.properties[prop['key']] = prop['value']
    end
    self.properties_will_change!
  end

  def delete_properties=(props)
    props.each do |prop|
      self.properties.delete(prop)
    end
    self.properties_will_change!
  end

  def self.public
    where(organization_id: nil)
  end

  def container_type
    ContainerType.find_by_shortname! container_type_shortname
  end

  def as_indexed_json(opts = {})
    self.searchkick_as_json(opts.deep_merge(Resource.full_json))
  end

  def serializable_hash(opts = {})
    opts = Resource.full_json.merge(opts || {})
    super(opts)
  end

  def search_data
    searchkick_as_json(
      only: [ :id, :name, :kind, :storage_condition, :purity, :updated_at, :created_at, :organization_id, :deleted_at,
:compound_id ],
      include: {}
    ).merge(
      material_names: materials.pluck(:name)
    )
  end

  def validate_sensitivities
    if sensitivities.detect { |s| !SENSITIVITIES.include?(s) }
      errors.add(:sensitivities, :invalid)
    end
  end

  def validate_compound_kind
    if compound && kind != 'ChemicalStructure'
      errors.add(:kind, 'can have a compound only when kind is ChemicalStructure')
    end
    if !purity.nil? && kind != 'ChemicalStructure'
      errors.add(:kind, 'can have purity only when kind is ChemicalStructure')
    end
  end
end
