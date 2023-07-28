class MaterialComponent < ApplicationRecord
  include ActiveModel::Validations

  has_snowflake_id('matc')
  acts_as_paranoid

  attribute :concentration, Concentration::ConcentrationType.new

  belongs_to :material
  belongs_to :resource

  has_many :orderable_material_components, dependent: :destroy

  validates :material, presence: true
  validates :resource, presence: true
  validates :concentration, concentration: true
  validate :concentration_immutability, on: :update

  scope :filter_by_provisionable, lambda { |value|
    joins(:orderable_material_components)
      .where(orderable_material_components: { provisionable: value }).distinct
  }

  def concentration_immutability
    if will_save_change_to_concentration? && concentration_in_database.present?
      errors.add(:concentration, "is already set and cannot be updated")
    end
  end

  def is_private
    self.material.is_private
  end

  def organization
    self.material.organization
  end

  def self.full_json
    {
      only: self.column_names,
      include: {
        resource: Resource.short_json
      }
    }
  end
end
