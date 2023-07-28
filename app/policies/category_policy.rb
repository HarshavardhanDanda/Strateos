class CategoryPolicy < ApplicationPolicy

  def index?
    has_feature_in_org(VIEW_PUBLIC_MATERIALS) || has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  def show?
    has_feature_in_org(VIEW_PUBLIC_MATERIALS) || has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_PUBLIC_MATERIALS) || has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
