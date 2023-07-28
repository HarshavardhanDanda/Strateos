class RunSchedulePolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def create?
    is_authorized?
  end

  def destroy?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
  end

  class Scope < Scope
    def resolve
      lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)
      run_ids = Run.select(:id).where(lab: lab_ids)
      scope.where(run_id: run_ids)
    end
  end
end
