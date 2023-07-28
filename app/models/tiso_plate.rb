class TisoPlate < ApplicationRecord
  has_snowflake_id('tp')
  acts_as_paranoid
  validates_presence_of :device_name, :row, :column
end
