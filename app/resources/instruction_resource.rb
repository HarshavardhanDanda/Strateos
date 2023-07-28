require 'base_resource'

module Api
  module V1
    class InstructionResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :aliquot_ids
      add_attribute :completed_at
      add_attribute :completed_by_human
      add_attribute :created_at
      add_attribute :data_name
      add_attribute :executed_at
      add_attribute :op
      add_attribute :operation
      add_attribute :run_id
      add_attribute :sequence_no
      add_attribute :started_at
      add_attribute :updated_at
      add_attribute :generated_containers
      add_attribute :generates_execution_support_artifacts

      has_one :run
      has_one :dataset
      has_many :warps
      has_many :refs, through: :instructions_refs

      def generated_containers
        @model.generated_containers.map do |container|
          {
            id: container.id,
            label: container.label
          }
        end
      end

      filter :op
      filter :run_id
    end
  end
end
