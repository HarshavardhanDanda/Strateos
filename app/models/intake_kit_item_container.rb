# Join model for IntakeKitItem => Containers one to many assocation
class IntakeKitItemContainer < ApplicationRecord
  self.table_name = :intake_kit_item_containers

  belongs_to :intake_kit_item
  belongs_to :container
  validates :intake_kit_item, presence: true
  validates :container, presence: true

  def barcode
    Container.find(self.container.id).barcode
  end

  def self.full_json
    {
      only: self.column_names,
      methods: [ :barcode ],
      include: {}
    }
  end
end
