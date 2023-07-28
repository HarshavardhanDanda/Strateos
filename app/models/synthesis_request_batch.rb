class SynthesisRequestBatch < ApplicationRecord
  has_snowflake_id('srb')
  acts_as_paranoid
  audited associated_with: :synthesis_request
  self.table_name = :synthesis_requests_batches

  belongs_to :organization
  belongs_to :synthesis_request
  belongs_to :batch

  validates :organization, presence: true
  validates :synthesis_request, presence: true
  validates :batch, presence: true
  validates :batch_id, uniqueness: true
  validate :organization_match

  def organization_match
    if synthesis_request.organization != batch.organization
      errors.add(:batch, :organization_mismatch, value: batch.id)
    end
  end
end
