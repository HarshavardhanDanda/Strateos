class Workcell < ApplicationRecord
  has_snowflake_id("wc")
  has_many :work_units

  scope :by_lab_id, lambda { |lab_id|
    joins(:work_units).where("work_units.lab_id = ?", lab_id).distinct
  }

  # The workcell_id is the format used in `lab` repo as well, eg `wc0-frontend1`
  # It is a unique identifier, but not the pkey
  validates_presence_of :workcell_id
  validates_uniqueness_of :workcell_id

  validates_presence_of :node_id

  validates_presence_of :name
  validates_uniqueness_of :name

  validates_presence_of :region
  validates_inclusion_of :region, in: [ HAVEN_REGION_NAME, SD_REGION_NAME ]

  validates_presence_of :workcell_type
  validates_inclusion_of :workcell_type, in: [ MCX_TYPE, METAMCX_TYPE, INTEGRATION_TYPE ]

  validates_presence_of :uri_base

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end
end
