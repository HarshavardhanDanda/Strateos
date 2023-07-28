class ExecutionSupportArtifactInstruction < ApplicationRecord
  self.table_name = "execution_support_artifacts_instructions"

  belongs_to :execution_support_artifact
  belongs_to :instruction

  validate :instruction_op_matches_esa_instruction_ops
  validate :instruction_run_id_matches_esa_run_id
  validates_presence_of :execution_support_artifact, :instruction

  def instruction_run_id_matches_esa_run_id
    if instruction.run_id != execution_support_artifact.run_id
      # Reset the ESAI cache because if this validation fails, the cache still holds the ESAI and a save on the ESA
      # causes validation to occur using the errant cached ESAI
      execution_support_artifact.association(:execution_support_artifacts_instructions).reset
      errors.add(:instruction, :same_run,
                 :run_id => instruction.run_id, :esa_run_id => execution_support_artifact.run_id)
    end
  end

  def instruction_op_matches_esa_instruction_ops
    op = execution_support_artifact.instructions.first&.op
    if op.present? && op != instruction.op
      # Reset the ESAI cache because if this validation fails, the cache still holds the ESAI and a save on the ESA
      # causes validation to occur using the errant cached ESAI
      execution_support_artifact.association(:execution_support_artifacts_instructions).reset
      errors.add(:instruction, :same_op, :op => op)
    end
  end
end
