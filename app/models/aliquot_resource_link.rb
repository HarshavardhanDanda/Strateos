class AliquotResourceLink < ApplicationRecord
  has_snowflake_id('ar')

  belongs_to :aliquot
  belongs_to :resource

  validates_presence_of :aliquot
  validates_presence_of :resource
end
