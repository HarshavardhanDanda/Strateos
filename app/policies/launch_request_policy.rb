class LaunchRequestPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def update?
    (record_within_current_org? && has_feature_in_org(LAUNCH_RUN))
  end

  def authorized_in_lab?
    has_feature_in_lab(VIEW_RUN_DETAILS)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_RUN_DETAILS) && has_feature_in_org(VIEW_PROJECTS_RUNS)
        lab_ids = lab_ids_by_feature(VIEW_RUN_DETAILS)
        scope.where(lab_id: lab_ids).or(scope.where(organization: @organization))
      elsif has_feature_in_any_lab(VIEW_RUN_DETAILS)
        lab_ids = lab_ids_by_feature(VIEW_RUN_DETAILS)
        scope.where(lab_id: lab_ids)
      elsif has_feature_in_org(VIEW_PROJECTS_RUNS)
        scope.where(organization: @organization)
      end
    end
  end
end
