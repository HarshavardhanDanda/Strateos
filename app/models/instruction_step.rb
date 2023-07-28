class InstructionStep < ApplicationRecord
  self.table_name = :instruction_steps
  has_snowflake_id('is')

  belongs_to :instruction
  validates_presence_of :description
end
