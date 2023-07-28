class RefPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    RunPolicy.new(user_context, @record.run).show?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_EDIT_RUN_DETAILS) && has_feature_in_any_lab(VIEW_RUN_DETAILS)
        lab_ids = lab_ids_by_feature(VIEW_RUN_DETAILS)
        run_ids = Run.select(:id).joins(:project).where(projects: { organization: @organization })
        scope.joins(:run).where(run_id: run_ids).or(scope.joins(:run).where(runs: { lab_id: lab_ids }))
      elsif has_feature_in_any_lab(VIEW_RUN_DETAILS)
        lab_ids = lab_ids_by_feature(VIEW_RUN_DETAILS)
        scope.joins(:run).where(runs: { lab_id: lab_ids })
      elsif has_feature_in_org(VIEW_EDIT_RUN_DETAILS)
        run_ids = Run.select(:id).joins(:project).where(projects: { organization: @organization })
        scope.where(run_id: run_ids)
      end
    end
  end
end
