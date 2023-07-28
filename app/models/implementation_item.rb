class ImplementationItem < ApplicationRecord
  has_snowflake_id('im')
  belongs_to :shipment
  validates_presence_of :name
end
