class SynthesisProgram < ApplicationRecord
  has_snowflake_id('spr')
  acts_as_paranoid
  audited associated_with: :organization

  belongs_to :organization
  has_many :synthesis_requests
  has_many :synthesis_program_items
  has_many :libraries, :through => :synthesis_program_items, :source => :item, :source_type => "Library"
  has_many :batches, :through => :synthesis_program_items, :source => :item, :source_type => "Batch"
  has_many :return_shipments, :through => :synthesis_program_items, :source => :item, :source_type => "ReturnShipment"

  default_scope { order(created_at: :desc) }

  validates :name, presence: true, uniqueness: { scope: :organization }
  validates :organization, presence: true
end
