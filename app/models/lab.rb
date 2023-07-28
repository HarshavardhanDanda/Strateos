class Lab < ApplicationRecord
  has_snowflake_id('lb')

  belongs_to :address
  has_many :lab_consumers
  has_many :shipments
  has_many :organizations, :through => :lab_consumers
  has_many :work_units
  belongs_to :operated_by, class_name: "Organization"

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def shared_ccs_labs
    Lab.where(operated_by: self.operated_by)
  end

end
