class SynthesisRequest < ApplicationRecord
  has_snowflake_id('srq')
  acts_as_paranoid
  audited associated_with: :organization

  belongs_to :organization
  belongs_to :synthesis_program
  belongs_to :library
  has_many :synthesis_requests_batches, class_name: 'SynthesisRequestBatch', dependent: :destroy
  has_many :batches, through: :synthesis_requests_batches

  validates :name, presence: true, uniqueness: { scope: :organization }
  validates :organization, presence: true
  validates :started_at, presence: true, :if => :completed_at?
  validate :completed_at_after_started_at
  validate :library_organization
  validate :synthesis_program_organization

  private

  def completed_at_after_started_at
    if started_at.present? && completed_at.present? && (completed_at.before? started_at)
      errors.add(:completed_at, :invalid_date, started_at: started_at, completed_at: completed_at)
    end
  end

  def library_organization
    if library.present? && library.organization != organization
      errors.add(:library, :organization_mismatch, value: library.id)
    end
  end

  def synthesis_program_organization
    if synthesis_program.present? && synthesis_program.organization != organization
      errors.add(:synthesis_program, :organization_mismatch, value: synthesis_program.id)
    end
  end
end
