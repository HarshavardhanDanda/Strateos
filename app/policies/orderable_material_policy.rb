class OrderableMaterialPolicy < MaterialPolicy

  class Scope < Scope
    def resolve
      operator_org_ids = @organization.labs&.map(&:operated_by_id)

      if has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES) && has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.joins(:material).where(materials: { organization: @organization })
             .or(scope.joins(:material).where(materials: { organization_id: operator_org_ids, is_private: false }))
      elsif has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope.joins(:material).where(materials: { organization: @organization })
      elsif has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.joins(:material).where(materials: { organization: @organization, is_private: false })
             .or(scope.joins(:material).where(materials: { organization_id: operator_org_ids, is_private: false }))
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
