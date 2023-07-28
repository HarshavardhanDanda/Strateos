require 'base_resource'

module Api
  module V1
    class AliquotEffectResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :affected_container_id
      add_attribute :affected_well_idx
      add_attribute :created_at
      add_attribute :effect_data
      add_attribute :effect_type
      add_attribute :generating_instruction_id
      add_attribute :updated_at

      has_one :affected_container
      has_one :generating_instruction

      filter :affected_container_id
      filter :affected_well_idx
      filter :effect_type
      filter :generating_instruction_id

      # fetch both well_idx and effects for the entire container.
      filter :affected_well_idx, apply: lambda { |records, well_idx, _options|
        records.where("affected_well_idx = ? OR affected_well_idx is NULL", well_idx)
      }

      filter :run, apply: lambda { |records, run_id, _options|
        inst_ids = Instruction.where(run_id: run_id).pluck(:id)

        # HACK: We do the ordering by generating here to force postgres to use the correct DB index.
        records.where(generating_instruction_id: inst_ids).order(:generating_instruction_id)
      }

      def sortable_fields
        [ :created_at ]
      end

    end
  end
end
