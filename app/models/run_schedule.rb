class RunSchedule < ApplicationRecord
  has_snowflake_id('rs')
  belongs_to :run
  belongs_to :user, foreign_key: :created_by
  belongs_to :user, foreign_key: :updated_by

  validates_presence_of :start_date_time
  validates_presence_of :end_date_time
  validate :end_after_start

  def run_title
    run.title
  end

  def run_status
    run.status
  end

  def run_operator_id
    run.assigned_to_id
  end

  def run_priority
    run.priority
  end

  def same_lab(user, organization, work_unit_id)
    work_unit = WorkUnit.where(id: work_unit_id)

    if !work_unit.any?
      workcells = ASSET_MANAGEMENT_SERVICE.workcells(user, organization, nil, run.lab_id)
      current_workcell = workcells&.content&.filter { |workcell| workcell[:id] == work_unit_id }

      if !current_workcell.empty? && run.lab_id != current_workcell[0][:lab_id]
        return "run's lab_id is not same as workcell's lab_id"
      end

    elsif run.lab_id != work_unit[0]&.lab_id
      return "run's lab_id is not same as work_unit's lab_id"
    end
  end

  private

  def end_after_start
    return if end_date_time.blank? || start_date_time.blank?

    if end_date_time <= start_date_time
      errors.add(:end_date_time, "must be after the start date")
    end
  end
end
