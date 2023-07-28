module EsaGenerators
  extend ActiveSupport::Concern

  class_methods do
    # Generates an ESA for a given run and instructions. The generation routine is based on the instruction type and
    # within a given instruction type there can be multiple ESAs to be generated.
    #
    # @param run the run to generate an ESA for
    # @param instructions the instructions to generate an ESA for
    #
    # @raise Error
    def generate(run, instructions)
      raise RunOrInstructionIdMissingError if run.nil? or instructions.nil?
      raise RunInstructionRunMatchError if instructions.pluck(:run_id).uniq.first != run.id

      ops = instructions.pluck(:op).uniq
      raise MultipleOpError if ops.size > 1

      case ops.first
      when "sanger_sequence"
        esa = SangerSequenceEton.generate(run, instructions)
      else
        raise NoESAGeneratorError, ops.first
      end
      esa.save!
      esa
    end
  end
end
