class OrderableMaterialComponent < ApplicationRecord
  has_snowflake_id('omatc')
  acts_as_paranoid

  GREEK_MU = 956.chr
  LATIN_MU = 181.chr

  belongs_to :orderable_material
  belongs_to :material_component
  belongs_to :container_type

  has_one :resource, :through => :material_component

  has_many :containers
  has_many :refs

  before_validation :normalize_measurement_units

  validates :orderable_material, presence: true
  validates :material_component, presence: true
  validates :no_of_units, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validate :validate_units
  validates :volume_per_container, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :mass_per_container, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :provisionable, inclusion: { in: [ true, false ] }
  validates :dispensable, inclusion: { in: [ true, false ] }
  validates :indivisible, inclusion: { in: [ true, false ] }
  validates :reservable, inclusion: { in: [ true, false ] }
  validates_presence_of :name, :if => :is_group_material

  scope :filter_by_resource_supplier_vendor, lambda { |resource_id, supplier_id, vendor_id|
    joins(:material_component)
      .where(material_components: { resource_id: resource_id })
      .joins(orderable_material: :material)
      .where(orderable_material: { materials: { vendor_id: vendor_id, supplier_id: supplier_id }})
  }

  after_initialize lambda {
    self.provisionable ||= false
    self.dispensable ||= false
    self.indivisible ||= false
    self.reservable ||= false
  }

  before_validation lambda {
    self.name ||= self.resource&.name if is_group_material
  }

  def self.full_json
    {
      only: self.column_names,
      include: {
        resource: Resource.short_json,
        container_type: { only: [ :id, :name ] }
      }
    }
  end

  def is_private
    self.orderable_material.material.is_private
  end

  def is_group_material
    self.orderable_material&.material&.material_type === 'group'
  end

  def organization
    self.orderable_material.material.organization
  end

  def validate_units
    if volume_per_container&.nonzero? && vol_measurement_unit.blank?
      errors.add :vol_measurement_unit, 'volume measurement unit must be provided'
    end
    if mass_per_container&.nonzero? && mass_measurement_unit.blank?
      errors.add :mass_measurement_unit, 'mass measurement unit must be provided'
    end
    if (volume_per_container.blank? && vol_measurement_unit.blank?) &&
       (mass_per_container.blank? && mass_measurement_unit.blank?)
      errors.add :message, 'either volume or mass data must be provided'
    end
    if volume_per_container.blank? && !vol_measurement_unit.blank?
      errors.add :volume_per_container, 'volume per container must be provided'
    end
    if mass_per_container.blank? && !mass_measurement_unit.blank?
      errors.add :mass_per_container, 'mass per container must be provided'
    end
  end

  def normalize_measurement_units
    if !mass_measurement_unit.blank? && !mass_per_container.blank?
      begin
        mass = RubyUnits::Unit.new("#{mass_per_container} #{mass_measurement_unit.downcase}")
        converted_mass = mass >> 'mg'
        self.mass_per_container = converted_mass.scalar.round(2)
        self.mass_measurement_unit = 'mg'
      rescue Exception => e
        errors.add :mass_measurement_unit, e.message
      end
    end
    if !vol_measurement_unit.blank? && !volume_per_container.blank?
      if self.vol_measurement_unit == "#{GREEK_MU}l" || self.vol_measurement_unit == "#{LATIN_MU}l"
        self.vol_measurement_unit = 'ul'
      end
      begin
        volume = RubyUnits::Unit.new("#{volume_per_container} #{vol_measurement_unit.downcase}")
        converted_volume = volume >> 'ul'
        self.volume_per_container = converted_volume.scalar.round(2)
        self.vol_measurement_unit = "#{GREEK_MU}l"
      rescue Exception => e
        errors.add :vol_measurement_unit, e.message
      end
    end
  end
end
