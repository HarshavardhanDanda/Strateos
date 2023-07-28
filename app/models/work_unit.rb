class WorkUnit < ApplicationRecord
  has_snowflake_id('wu')
  belongs_to :lab
  belongs_to :workcell

  scope :by_lab_operator, lambda { |org_id|
    joins(:lab).where("labs.operated_by_id = ?", org_id).distinct
  }

  validates_presence_of :lab
end
