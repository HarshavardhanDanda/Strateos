class RunPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def show?
    project = @record.project
    is_authorized? && (show_in_lab? || (!project.is_hidden && show_in_org?))
  end

  def show_in_org?
    has_feature_in_org(VIEW_EDIT_RUN_DETAILS)
  end

  def show_in_lab?
    has_feature_in_any_lab(VIEW_RUN_DETAILS)
  end

  def create?
    @record.can_be_seen_by?(@user)
  end

  def clone?
    protocol = @record.protocol

    protocol&.published && ((record_within_current_org? && has_feature_in_org(VIEW_EDIT_RUN_DETAILS)) ||
      has_feature_in_lab(CLONE_RUN_IN_LAB))
  end

  def cancel?
    (record_within_current_org? && show_in_org?) || has_feature_in_lab(CANCEL_RUN_IN_LAB)
  end

  def create_with_autoprotocol?
    has_feature_in_org(SUBMIT_AUTOPROTOCOL) || has_feature_in_org(MANAGE_EXPERIMENTS)
  end

  def view_internal_quote_items?
    @user.transcriptic_user?
  end

  def update?
    show_in_lab? || (record_within_current_org? && show_in_org?) || instruction?
  end

  def feedback?
    record_within_current_org? || has_feature_in_lab(VIEW_RUN_DETAILS)
  end

  def accept?
    @record.can_be_seen_by?(@user)
  end

  def robots?
    instruction?
  end

  def upload_dataset?
    @record.can_be_seen_by?(@user)
  end

  def search?
    is_authorized?
  end

  def claim?
    has_feature_in_lab(CLAIM_RUN) && @user.member_of_org?(@record.lab.operated_by)
  end

  def assign?
    can_manage_run_state? && @user.member_of_org?(@record.lab.operated_by)
  end

  def priority?
    can_manage_run_state?
  end

  def approval?
    can_manage_run_state?
  end

  def reject?
    can_manage_run_state?
  end

  def abort?
    authorized_in_lab?
  end

  def schedule?
    has_feature_in_lab(RESERVE_DEVICE_FOR_EXECUTION)
  end

  def multiple_schedule?
    has_feature_in_lab(MULTI_DEVICE_RUN_SCHEDULE)
  end

  def instruction?
    has_feature_in_lab(SUBMIT_INSTRUCTIONS_TO_EXECUTE)
  end

  def execute_programs?
    has_feature_in_lab(SUBMIT_INSTRUCTIONS_TO_EXECUTE)
  end

  def can_manage_run_state?
    has_feature_in_lab(RUN_STATE_MGMT)
  end

  def authorized_in_lab?
    has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
  end

  def authorized_in_org?
    has_feature_in_org(VIEW_PROJECTS_RUNS)
  end

  def is_authorized?
    authorized_in_lab? || authorized_in_org?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_PROJECTS_RUNS) && has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)
        organization_id = @organization.id
        scope
          .joins(:project)
          .where(
            "runs.lab_id in (:lab_ids) or
            (projects.organization_id = :organization_id and projects.is_hidden = false)",
            {
              lab_ids: lab_ids,
              organization_id: organization_id
            }
          )
      elsif has_feature_in_org(VIEW_PROJECTS_RUNS)
        scope
          .joins(:project)
          .where(projects: { organization_id: @organization.id, is_hidden: false })
      elsif has_feature_in_any_lab(VIEW_RUNS_IN_LABS)
        lab_ids = lab_ids_by_feature(VIEW_RUNS_IN_LABS)
        scope.where(lab: lab_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
