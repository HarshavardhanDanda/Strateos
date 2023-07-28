class SupplierPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    (is_authorized? && record_within_current_org?) || can_view_supplier?
  end

  def create?
    is_authorized? && record_within_current_org?
  end

  def destroy?
    is_authorized? && record_within_current_org?
  end

  def is_authorized?
    has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  def can_view_supplier?
    operator_org_ids = @organization.labs&.map(&:operated_by_id)
    has_feature_in_org(VIEW_PUBLIC_MATERIALS) &&
      (record_within_current_org? || operator_org_ids.include?(@record.organization&.id))
  end

  class Scope < Scope
    def resolve
      operator_org_ids = @organization.labs&.map(&:operated_by_id)
      if has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.where(organization: @organization).or(scope.where(organization_id: operator_org_ids))
      elsif has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope.where(organization: @organization)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
