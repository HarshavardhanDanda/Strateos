class ProjectPolicy < ApplicationPolicy
  def create_run?
    is_authorized_in_lab(CLONE_RUN_IN_LAB) ||
      (record_within_current_org && has_feature_in_org(CREATE_EDIT_PROJECT))
  end

  def index?
    return true if can_manage_orgs_global?

    has_feature_in_org(VIEW_PROJECTS_RUNS) || has_feature_in_any_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
  end

  def show?
    authorized_in_lab? ||
      (record_within_current_org && authorized_in_org? && !@record.is_hidden) ||
      (has_feature_in_any_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB) && @record.is_hidden)
  end

  def create?
    (!@record.is_hidden && has_feature_in_org(CREATE_EDIT_PROJECT)) ||
      authorize_implementation_project_in_lab
  end

  def update?
    (record_within_current_org && has_feature_in_org(CREATE_EDIT_PROJECT) && !@record.is_hidden) ||
      authorize_implementation_project_in_lab
  end

  def destroy?
    (record_within_current_org && has_feature_in_org(CREATE_EDIT_PROJECT) && !record.is_hidden) ||
      authorize_implementation_project_in_lab
  end

  def archive?
    record_within_current_org && has_feature_in_org(CREATE_EDIT_PROJECT)
  end

  def transfer?
    record_within_current_org && has_feature_in_org(TRANSFER_PROJECT)
  end

  def authorized_in_lab?
    is_authorized_in_lab(VIEW_RUN_DETAILS)
  end

  def authorized_in_org?
    has_feature_in_org(VIEW_PROJECTS_RUNS)
  end

  def record_within_current_org
    @record.organization == @organization
  end

  def authorize_implementation_project_in_lab
    @record.is_hidden && is_authorized_in_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_PROJECTS_RUNS) && has_feature_in_any_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
        scope.where(organization: @organization, is_hidden: false)
             .or(scope.where(organization: consumer_org_ids, is_hidden: true))
      elsif has_feature_in_org(VIEW_PROJECTS_RUNS)
        scope.where(organization: @organization, is_hidden: false)
      elsif has_feature_in_any_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
        scope.where(organization: consumer_org_ids, is_hidden: true)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
