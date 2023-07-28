class OrderableMaterialComponentPolicy < MaterialPolicy
  def index?
    true
  end

  def create?
    true
  end

  def reserve?
    super && @record.reservable
  end

  class Scope < Scope
    def resolve
      operator_org_ids = @organization.labs&.map(&:operated_by_id)

      if has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES) && has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.joins(orderable_material: :material)
             .where(orderable_material: { materials: { organization: @organization }})
             .or(scope.joins(orderable_material: :material)
                      .where(orderable_material: { materials:
                                                     { organization_id: operator_org_ids, is_private: false }}))
      elsif has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES)
        scope.joins(orderable_material: :material)
             .where(orderable_material: { materials: { organization: @organization }})
      elsif has_feature_in_org(VIEW_PUBLIC_MATERIALS)
        scope.joins(orderable_material: :material)
             .where(orderable_material: { materials: { organization: @organization, is_private: false }})
             .or(scope.joins(orderable_material: :material)
                      .where(orderable_material: { materials:
                                                     { organization_id: operator_org_ids, is_private: false }}))
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
