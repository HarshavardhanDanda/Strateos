class RunBatch < ApplicationRecord
  self.table_name = :run_batch
  acts_as_paranoid
  audited

  belongs_to :batch
  belongs_to :run
  validate :validate_same_org

  def validate_same_org
    if batch.organization != run.project.organization
      run.errors.add(:message, "Batch '#{batch.id}' does not belong to the same organization as run")
    end
  end
end
