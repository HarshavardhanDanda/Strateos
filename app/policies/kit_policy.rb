class KitPolicy < ApplicationPolicy

  def create?
    is_authorized?
  end

  def show?
    is_authorized? || (has_feature_in_org(VIEW_PUBLIC_MATERIALS) && @record.can_be_seen_by?(@user))
  end

  def reserve?
    @record.can_be_seen_by?(@user)
  end

  def update?
    is_authorized_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  def destroy?
    is_authorized_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  def index?
    true
  end

  def is_authorized?
    has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  class Scope < Scope
    def resolve
      operator_org_ids = @organization&.labs&.map(&:operated_by_id)
      if has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope.where(organization: @organization).or(scope.where(organization_id: operator_org_ids, is_private: false))
      elsif has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.where(organization_id: @organization, is_private: false)
             .or(scope.where(organization_id: operator_org_ids, is_private: false))
      else
        scope.where(organization_id: operator_org_ids, is_private: false)
      end
    end
  end
end
