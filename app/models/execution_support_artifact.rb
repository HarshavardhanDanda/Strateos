class ExecutionSupportArtifact < ApplicationRecord
  include EsaGenerators
  has_snowflake_id "esa"

  ############
  # Relations
  ############
  belongs_to :run, -> { without_large_columns }
  has_many :execution_support_artifacts_instructions,
           class_name: "ExecutionSupportArtifactInstruction",
           dependent: :destroy
  has_many :instructions, through: :execution_support_artifacts_instructions

  enum status: [ :ungenerated, :processing, :generated, :error ]
  accepts_nested_attributes_for :execution_support_artifacts_instructions

  ##############
  # Validations
  ##############
  validate :has_single_instruction_op
  validate :operation_matches_instruction_op
  validates_presence_of :run
  validates_presence_of :name
  validates_uniqueness_of :name, scope: :run_id

  def has_single_instruction_op
    errors.add(:instructions, :same_op, :value => instructions.map(&:id)) unless instruction_ops.size <= 1
  end

  def operation_matches_instruction_op
    if instruction_ops.present? && operation != instruction_ops.first
      errors.add(:operation, :match_instructions, :value => operation, :instruction_op => instruction_ops.first)
    end
  end

  def instruction_ops
    instructions.map(&:op).uniq
  end

  #########
  # Scopes
  #########

  # Parameterized scope that filters ESAs that reference all of the instruction_ids provided in any order
  scope :with_instructions, lambda { |instruction_ids|
    conditional_string = '{ ' + ([ "%s" ] * instruction_ids.size).join(',') + ' }'
    joins(:instructions)
      .group(:id)
      .having("array_agg(instructions.id) <@ '#{conditional_string}'", *instruction_ids)
  }

end

class ESAGenerationError < StandardError
end

class NoESAGeneratorError < ESAGenerationError
  def initialize(op)
    @op = op
  end

  def message
    I18n.t "errors.esa_generation.no_generator", :op => @op
  end
end

class RunInstructionRunMatchError < ESAGenerationError
  def message
    I18n.t "errors.esa_generation.run_instruction_run_match"
  end
end

class RunOrInstructionIdMissingError < ESAGenerationError
  def message
    I18n.t "errors.esa_generation.missing_ids"
  end
end

class MultipleOpError < ESAGenerationError
  def message
    I18n.t "errors.esa_generation.multiple_ops"
  end
end
