class AuditPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    # For now we only support dataset logs
    if @record.auditable_type == "Dataset" && @record.associated_type == "Run"
      run = Run.find(@record.associated_id)
      dataset = Dataset.find(@record.auditable_id)
      return run.can_be_seen_by?(@user) && dataset.is_analysis
    else
      false
    end
  end

  def update?
    false
  end

  def destroy?
    false
  end

  class Scope < Scope
    # For now we only support dataset logs
    def resolve
      if !has_feature_in_org(VIEW_PROJECTS_RUNS) and !has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        raise Pundit::NotAuthorizedError
      elsif has_feature_in_org(VIEW_PROJECTS_RUNS) && has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)
        organization_id = @organization.id
        scope
          .where(auditable_type: "Dataset", associated_type: "Run")
          .joins("LEFT JOIN runs on audits.associated_id = runs.id")
          .joins("LEFT JOIN projects on runs.project_id = projects.id")
          .where(
            "runs.lab_id in (:lab_ids) or projects.organization_id = :organization_id",
            {
              lab_ids: lab_ids,
              organization_id: organization_id
            }
          )
      elsif has_feature_in_org(VIEW_PROJECTS_RUNS)
        scope
          .where(auditable_type: "Dataset", associated_type: "Run")
          .joins("LEFT JOIN runs on audits.associated_id = runs.id")
          .joins("LEFT JOIN projects on runs.project_id = projects.id")
          .where(projects: { organization_id: @organization.id })
      elsif has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)
        scope
          .where(auditable_type: "Dataset", associated_type: "Run")
          .joins("LEFT JOIN runs on audits.associated_id = runs.id")
          .where(
            "runs.lab_id in (:lab_ids)",
            {
              lab_ids: lab_ids,
            }
          )
      else
        scope
      end
    end
  end
end
