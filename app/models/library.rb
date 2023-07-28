class Library < ApplicationRecord
  has_snowflake_id('lib')
  acts_as_paranoid
  audited

  belongs_to :organization
  has_and_belongs_to_many :compound_links
  has_many :synthesis_program_items, as: :item
  has_many :synthesis_programs, through: :synthesis_program_items

  default_scope { order(:name) }

  validates :name, presence: true, uniqueness: { scope: :organization }
  validates :organization, presence: true
end
