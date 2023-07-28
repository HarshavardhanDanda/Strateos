class InstructionRef < ApplicationRecord
  self.table_name = :instructions_refs

  belongs_to :instruction
  belongs_to :ref
end
