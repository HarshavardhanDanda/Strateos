class MaterialPolicy < ApplicationPolicy

  def index?
    true
  end

  def create?
    has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  def show?
    is_authorized? || can_view_public_material?
  end

  def update?
    is_authorized?
  end

  def destroy?
    is_authorized?
  end

  def reserve?
    show?
  end

  def is_authorized?
    has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES) && record_within_current_org?
  end

  def can_view_public_material?
    operator_org_ids = @organization.labs&.map(&:operated_by_id)
    has_feature_in_org(VIEW_PUBLIC_MATERIALS) && !@record.is_private &&
      (record_within_current_org? || operator_org_ids.include?(@record.organization&.id))
  end

  class Scope < Scope
    def resolve
      operator_org_ids = @organization.labs&.map(&:operated_by_id)

      if has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES) && has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.where(organization_id: @organization)
             .or(scope.where(organization_id: operator_org_ids, is_private: false))
      elsif has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope.where(organization: @organization)
      elsif has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.where(organization_id: @organization, is_private: false)
             .or(scope.where(organization_id: operator_org_ids, is_private: false))
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
