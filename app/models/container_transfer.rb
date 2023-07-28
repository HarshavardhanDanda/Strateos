class ContainerTransfer < ApplicationRecord
  has_snowflake_id('cx')
  audited associated_with: :container

  belongs_to :container
  belongs_to :device
  has_one :shipment

  validates_presence_of :container

  def is_shipment?
    not self.shipment.nil?
  end
end
