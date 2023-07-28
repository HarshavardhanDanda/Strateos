class Supplier < ApplicationRecord
  has_snowflake_id('sup')

  has_many :materials
  belongs_to :organization, optional: false
  before_validation :normalize_name, :only => [ :name ]

  validates :name, presence: true, allow_blank: false,
:uniqueness => { :case_sensitive => false, :scope => :organization_id }

  SUPPLIER_CREATION_JSON = File.read(Rails.root.join('app/models/schemas/supplier_creation.json'))
  SUPPLIER_CREATION_SCHEMA = JSON.parse(SUPPLIER_CREATION_JSON)

  def self.flat_json
    { only: self.column_names, include: {}}
  end

  def supplier_has_materials
    !self.materials.empty?
  end

  private

  def normalize_name
    self.name = name&.squish
  end
end
