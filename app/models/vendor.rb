class Vendor < ApplicationRecord
  has_snowflake_id('vend')

  has_many :kits, dependent: :restrict_with_error
  has_many :materials, dependent: :restrict_with_error
  belongs_to :organization

  validates :name, presence: true, allow_blank: false,
:uniqueness => { :case_sensitive => false, :scope => :organization_id }
  before_validation :remove_extra_whitespaces, :only => [ :name ]

  def remove_extra_whitespaces
    self.name = self.name.squish unless self.name.nil?
  end

  def self.flat_json
    { only: self.column_names, include: {}}
  end

  FULL_JSON = {
    only: [
      :id, :name
    ],
    include: {}
  }

  SHORT_JSON = {
    only: [
      :id, :name
    ]
  }

  def vendor_has_materials
    !self.materials.empty?
  end

  def serializable_hash(opts = {})
    opts = FULL_JSON.merge(opts || {})
    super(opts)
  end
end
