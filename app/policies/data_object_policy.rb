class DataObjectPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def show?
    DatasetPolicy.new(user_context, @record.dataset).show?
  end

  def create?
    is_authorized?
  end

  def update?
    false
  end

  def destroy?
    false
  end

  def authorized_in_lab?
    has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
  end

  def authorized_in_org?
    has_feature_in_org(VIEW_EDIT_RUN_DETAILS)
  end

  def is_authorized?
    authorized_in_lab? || authorized_in_org?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_EDIT_RUN_DETAILS) && has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)

        scope.joins(
          <<-SQL
            INNER JOIN datasets ON datasets.id = data_objects.dataset_id
            LEFT OUTER JOIN instructions ON instructions.id = datasets.instruction_id
            INNER JOIN runs ON (runs.id = instructions.run_id OR runs.id = datasets.run_id)
            INNER JOIN projects ON projects.id = runs.project_id
          SQL
        ).where(
          "runs.lab_id in (:lab_ids) or projects.organization_id in (:org_id)",
          {
            lab_ids: lab_ids,
            org_id: @organization.id
          }
        )
      elsif has_feature_in_org(VIEW_EDIT_RUN_DETAILS)
        scope.joins(
          <<-SQL
            INNER JOIN datasets ON datasets.id = data_objects.dataset_id
            LEFT OUTER JOIN instructions ON instructions.id = datasets.instruction_id
            INNER JOIN runs ON (runs.id = instructions.run_id OR runs.id = datasets.run_id)
            INNER JOIN projects ON projects.id = runs.project_id
          SQL
        ).where(projects: { organization_id: @organization.id })
      elsif has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)

        scope.joins(
          <<-SQL
            INNER JOIN datasets ON datasets.id = data_objects.dataset_id
            LEFT OUTER JOIN instructions ON instructions.id = datasets.instruction_id
            INNER JOIN runs ON (runs.id = instructions.run_id OR runs.id = datasets.run_id)
          SQL
        ).where(runs: { lab_id: lab_ids })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
