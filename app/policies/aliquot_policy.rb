class AliquotPolicy < ApplicationPolicy
  def manage?
    return false if eigenclass?

    @record.new_record? or @record.organization&.admin?(@user)
  end

  def index?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) || has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
  end

  def show?
    has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB, @record.container) || has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
  end

  def create?
    false
  end

  def update?
    (has_feature_in_org(EDIT_CONTAINER) && record_within_current_org_or_org_null?) || has_feature_in_lab(
MANAGE_CONTAINERS_IN_LAB, @record.container)
  end

  # assumes an array of aliquots and optimally verifies
  def update_all?
    user_org_ids = @user.organizations.pluck(:id).to_set

    container_ids     = @record.group_by(&:container_id).keys
    container_org_ids = Container.with_deleted.find(container_ids).pluck(:organization_id).to_set

    missing_org_ids = container_org_ids - user_org_ids

    missing_org_ids.empty?
  end

  class Scope < Scope

    def resolve
      if has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.joins(:container).with_deleted.where(containers: { lab: lab_ids })
             .or(scope.joins(:container).with_deleted.where(containers: { organization: @organization }))
      elsif has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.joins(:container).with_deleted.where(containers: { lab: lab_ids })
      elsif has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        scope.joins(:container).with_deleted.where(containers: { organization: @organization })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end

  def record_within_current_org_or_org_null?
     return true if @record.container&.organization == @organization
     @record.container&.organization.nil?
  end
end
