require 'base_resource'

module Api
  module V1
    class RunScheduleResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :start_date_time
      add_attribute :end_date_time
      add_attribute :run_id
      add_attribute :work_unit_id
      add_attribute :created_by
      add_attribute :updated_by
      add_attribute :run_title
      add_attribute :run_status
      add_attribute :run_operator_id
      add_attribute :run_priority

      filter :run_id
      filter :work_unit_id

      filter :lab_id, apply: lambda { |records, lab_id, _options|
        records.joins(:run).where(runs: { lab_id: lab_id })
      }

      filter :operator_ids, apply: lambda { |records, operator_ids, _options|
        if operator_ids.include? 'unassigned'
          operator_ids.delete('unassigned')
          operator_ids.push(nil)
        end

        if operator_ids.include? 'all'
          records.joins(:run)
        else
          records.joins(:run).where(runs: { assigned_to_id: operator_ids })
        end
      }

      filter :start_date_after,
        verify: ->(values, context) {
          values.map(&:to_datetime)
        },
        apply:->(records, start_dates, _options) {
          start_date = start_dates.first
          records.where("start_date_time >= ?", start_date)
        }

      filter :end_date_before,
        verify: ->(values, context) {
          values.map(&:to_datetime)
        },
        apply: ->(records, end_dates, _options) {
          end_date = end_dates.first
          records.where("end_date_time <= ?", end_date)
        }

      filter :organization_id, apply: lambda { |records, organization_id, _options|
        records.joins(run: :project).where(projects: { organization_id: organization_id })
      }

    end
  end
end
