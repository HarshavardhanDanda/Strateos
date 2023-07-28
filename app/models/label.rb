class Label < ApplicationRecord
  has_snowflake_id 'lbl'
  has_many :labelings,  dependent: :destroy
  has_many :compound_links, through: :labelings, source: :labelable, source_type: 'CompoundLink'
  belongs_to :organization

  validates_uniqueness_of :name, scope: :organization_id

  searchkick(word_start: [ :name ], callbacks: :async)

  scope :public_only, -> { where(organization_id: nil) }
  scope :with_name, ->(raw_name) { where(name: Label.normalize_name(raw_name)) }

  def name=(raw_name)
    write_attribute(:name, Label.normalize_name(raw_name))
  end

  def self.normalize_name(raw_name)
    raw_name.squish
  end

end
