require 'base_resource'

module Api
  module V1
    class DatasetResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :is_analysis
      add_attribute :analysis_tool
      add_attribute :attachments
      add_attribute :created_at
      add_attribute :data
      add_attribute :data_type
      add_attribute :device_id
      add_attribute :instruction_id
      add_attribute :metadata
      add_attribute :parameters
      add_attribute :project_id
      add_attribute :run_id
      add_attribute :supported_formats
      add_attribute :title
      add_attribute :updated_at
      add_attribute :uploaded_by
      add_attribute :warp_id

      filter :data_type
      filter :instruction_id

      # fetch both well_idx and effects for the entire container.
      filter :run_id, apply: lambda { |records, run_id, _options|
        # assumes we already did a join on runs in scope.
        records.where(runs: { id: run_id })
      }

      filter :instruction_op, apply: lambda { |records, op, _options|
        # assumes we already did a join on instructions in scope.
        records.where(instructions: { op: op })
      }

      filter :created_after, apply: lambda { |records, timestamp_values, _options|
        timestamp = timestamp_values.first.to_i

        records.where('datasets.created_at > ?', Time.at(timestamp))
      }

      filter :organization_id, apply: lambda { |records, organization_id, _options|
        # assumes we already did a join on runs in scope.
        records.where(projects: { organization_id: organization_id })
      }

      # When using multiple advanced filters, like `instruction_op` and `run_id` they each need
      # to have joined on instruction and will fail to generate valid sql if they join multiple times.
      def self.maybe_add_instruction_join(records)
        should_join =
          if records == Dataset
            true
          elsif records.kind_of?(Dataset::ActiveRecord_Relation)
            has_join = records.left_outer_joins_values.find { |j| j.to_s.match('instruction') }
            !has_join
          else
            false
          end

        if should_join
          # we use `joins` and not the `left_outer_joins` method as
          # active record has weird ordering when generating the arel query.
          records.joins("LEFT OUTER JOIN instructions ON instructions.id = datasets.instruction_id")
        else
          records
        end
      end
    end
  end
end
