class LocationType < ApplicationRecord

  has_snowflake_id('loctyp')
  has_many                :locations
  has_and_belongs_to_many :container_types, -> { distinct }
  validates               :category, presence: true
  validates_uniqueness_of :name, allow_nil: false

  def self.full_json
    {
      only: [
        :id, :name, :category, :capacity, :created_at, :updated_at,
        :location_type_categories, :num_rows, :num_cols
      ]
    }
  end

  def serializable_hash(opts = {})
    opts = LocationType.full_json.merge(opts || {})
    super(opts)
  end

  def to_s
    "LocationType(#{id}) #{category} #{name}"
  end

  def tiso_column?
    category == 'tiso_column'
  end

  def plate_rack_cell?
    category == 'rack_cell'
  end

  def tube_cell?
    category == 'box_cell'
  end

  def box?
    category == 'box'
  end

  def rack?
    category == 'rack'
  end

end
