class IntakeKitItem < ApplicationRecord
  belongs_to :intake_kit
  belongs_to :container_type
  has_many :intake_kit_item_containers, class_name: :IntakeKitItemContainer
  has_many :containers, through: :intake_kit_item_containers

  accepts_nested_attributes_for :intake_kit_item_containers, allow_destroy: true

  def self.full_json
    {
      only: self.column_names,
      methods: [],
      include: {
        intake_kit_item_containers: IntakeKitItemContainer.full_json
      }
    }
  end
end
