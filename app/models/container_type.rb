# Represents a particular type of a container you woulf find in a lab
# The Container modal points to one of these
class ContainerType < ApplicationRecord
  has_many                :containers
  has_and_belongs_to_many :location_types, -> { distinct }
  validates               :name, presence: true
  validates               :shortname, presence: true, uniqueness: true
  validates               :well_depth_mm, presence: true
  validates               :well_volume_ul, presence: true
  validate                :must_be_acceptable_lid
  validates               :well_count, presence: true

  scope :user_facing, -> { where('manual_execution = false') }
  scope :active,      -> { where(retired_at: nil) }
  scope :retired,     -> { where.not(retired_at: nil) }

  # All possible lids that can cover the various container types
  LIDS = Set.new([
                   'breathable',
                   'foil',
                   'low_evaporation',
                   'low_evaporation_rotated',
                   'screw-cap',
                   'standard',
                   'ultra-clear',
                   'universal'
                 ])

  CONSUMABLES = Set.new([ 'a1-vial', 'd1-vial', 'd2-vial' ])

  def must_be_acceptable_lid
    if !Set.new(acceptable_lids).subset? LIDS
      errors.add(:acceptable_lids, "must be a subset of #{LIDS.to_a}")
    end
  end

  PLATE_LOCATIONS_PER_HEIGHT_MAX = {
    (0..16)                    => [ 'tc9', 'tc10', 'tc11', 'tc12', 'tc6_large', 'tc5_large', 'plate_rack_cell' ],
    (16.to_f.next_float..48.5) => [ 'tc6_large', 'tc5_large', 'plate_rack_cell' ]
  }

  SCHEMA_CREATION_JSON = File.read(Rails.root.join('app/models/schemas/container_type_creation.json'))
  SCHEMA_CREATION = JSON.parse(SCHEMA_CREATION_JSON)

  ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  HUMAN_WELL_INDEX_REGEX = /^([a-z])?([a-z])(\d+)$/i
  ROBOT_WELL_INDEX_REGEX = /^\d+$/

  after_save :set_location_types

  # Update which LocationTypes can store this particular ContainerType
  # @return nil
  def set_location_types
    found_location_types = [ 'Unknown' ]

    PLATE_LOCATIONS_PER_HEIGHT_MAX.each do |max_height_range, location_types|
      next if self.is_tube || !self.height_mm
      next if !max_height_range.include?(self.height_mm)
      found_location_types.concat(location_types)
    end

    LocationType.where(name: found_location_types).each do |lt|
      if !lt.container_type_ids.include?(self.id)
        new_ids = lt.container_type_ids << self.id
        lt.container_type_ids = new_ids
        lt.save
      end
    end

    nil
  end

  # A minimal json representation
  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  FULL_JSON = {
    only: [
      :id, :name, :shortname, :well_count, :well_depth_mm,
      :well_volume_ul, :capabilities, :col_count, :is_tube,
      :acceptable_lids, :height_mm, :retired_at, :vendor, :catalog_number
    ],
    include: {},
    methods: [ :sale_price ]
  }.freeze

  ADMIN_JSON = {
    only: [
      :id, :name, :shortname, :well_count, :well_depth_mm,
      :well_volume_ul, :capabilities, :col_count, :is_tube,
      :acceptable_lids, :manual_execution, :height_mm, :retired_at
    ],
    include: {},
    methods: []
  }.freeze

  SHORT_JSON = {
    only: [
      :id, :name, :well_volume_ul, :shortname, :well_count, :col_count, :is_tube, :retired_at
    ],
    include: {},
    methods: []
  }.freeze

  # Profit margin in dollars that Strateos makes on this container type
  def profit_margin
    0.10
  end

  def sale_price
    cost_each * (PricingManager::SALES_TAX_MULTIPLIER + profit_margin)
  end

  def row_count
    well_count / col_count
  end

  # Checks if the passed index is a valid well in this container type
  #
  # @example
  #  well?('1') #=> true
  # @example If 100 is out of range of the number of wells
  #  well?('100') #=> true
  # @example
  #  well?('asdf') #=> false
  #
  # @return Boolean whether or not the index is a proper well index
  def well?(index)
    !robot_well(index).nil?
  end

  def is_retired?
    !retired_at.nil?
  end

  def is_plate
    not is_tube
  end

  def is_reservoir
    # our tests don't create container types with ids.
    name = self.id || self.shortname

    name.starts_with?('res') && (col_count == 1 || row_count == 1)
  end


  # Converts human readable well index to its corresponding integer index
  #
  # @example given 12 columns
  #  'A1' #=> 0
  # @example
  #  'B2' #=> 13
  # @example
  #  'AA1' #=> 312
  # @example
  #  'ZB12' #=> 8135
  #
  # @return Numbers
  def robot_well(index)
    row, col = robot_well_array(index)
    robot_well_from_row_col(row, col)
  end

  def robot_well_to_row_col(index)
    row = (index / col_count).floor
    col = index % col_count

    [ row, col ]
  end

  def robot_well_from_row_col(row, col)
    return nil unless !row.nil? && !col.nil?
    row * col_count + col
  end

  def robot_well_from_sbs96_shape(start_well, shape_row, shape_col)
    robot_well_from_shape(start_well, shape_row, shape_col, 8.0, 12.0)
  end

  def robot_well_from_sbs384_shape(start_well, shape_row, shape_col)
    robot_well_from_shape(start_well, shape_row, shape_col, 16.0, 24.0)
  end

  # Calculates the robot well given a start_well(robot), and a shape [row, col] offset.
  #
  # For example if we have a 1x1 reservoir and we start at start_well 0, with shape offsets [4, 6]
  # we should still get returned well 0 as the transformation is within the plate.
  #
  # If the shape offset is too large we return nil.
  #
  # This works by transforming between Plate coordinates [num_rows, num_cols] and the shape coordinates.
  # It makes the assumption that all space will be mappable and won't hit the rim of the plate.
  def robot_well_from_shape(start_well, shape_row, shape_col, shape_row_max, shape_col_max)
    row, col = robot_well_to_row_col(start_well)
    row_percent = row.to_f / row_count
    col_percent = col.to_f / col_count

    # transform coordinates and add transform
    sbs_row = row_percent * shape_row_max + shape_row
    sbs_col = col_percent * shape_col_max + shape_col

    if sbs_row >= shape_row_max || sbs_col >= shape_col_max
      # we have exceeded the bounds
      return nil
    end

    # transform back
    final_row = ((sbs_row / shape_row_max) * row_count).floor
    final_col = ((sbs_col / shape_col_max) * col_count).floor

    # convert to robot
    robot_well_from_row_col(final_row, final_col)
  end

  def robot_well_array(index)
    index = index.to_s

    if index =~ HUMAN_WELL_INDEX_REGEX
      first_letter = Regexp.last_match[1]
      second_letter = Regexp.last_match[2]

      first_letter_rows = first_letter ? (first_letter.upcase.ord + 1 - 'A'.ord) * ALPHABET.length : 0
      second_letter_rows = second_letter.upcase.ord - 'A'.ord

      row = first_letter_rows + second_letter_rows
      col = Regexp.last_match[3].to_i - 1
      return nil unless (0...col_count).cover? col and (0...row_count).cover? row
      [ row, col ]
    elsif index =~ ROBOT_WELL_INDEX_REGEX
      i = Integer(index)
      return nil unless (0...well_count).cover? i
      row = i / col_count
      col = i % col_count
      [ row, col ]
    else
      return nil
    end
  end

  def row_idx_to_letters(row_idx)
    first_letter_idx = (row_idx / ALPHABET.length).floor - 1
    second_letter_idx = row_idx % ALPHABET.length

    first_letter = first_letter_idx > -1 ? ALPHABET[first_letter_idx] : ''
    second_letter = ALPHABET[second_letter_idx]

    first_letter + second_letter
  end

  # Converts integer well index to its corresponding human readable index
  #
  # @example given 12 columns
  #  0 #=> 'A1'
  # @example
  #  13 #=> 'B2'
  # @example
  #  312 #=> 'AA1'
  # @example
  #  8135 #=> 'ZB12'
  #
  # @return String
  def human_well(index)
    robot_index = robot_well index
    return unless robot_index
    row_idx, col_idx = robot_well_to_row_col(robot_index)
    row_idx_to_letters(row_idx) + (col_idx + 1).to_s
  end

  LID_THICKNESS_MM = 2

  def lidded_plate_height
    height_mm + LID_THICKNESS_MM
  end

  def serializable_hash(opts = {})
    opts = FULL_JSON.merge(opts || {})
    super(opts)
  end
end
