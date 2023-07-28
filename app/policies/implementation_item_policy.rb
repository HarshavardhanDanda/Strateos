class ImplementationItemPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    is_authorized?
  end

  def destroy?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_lab(MANAGE_IMPLEMENTATION_SHIPMENTS, @record.shipment)
  end

  def update?
    has_feature_in_lab(MANAGE_IMPLEMENTATION_SHIPMENTS, @record.shipment)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_IMPLEMENTATION_SHIPMENTS)
        lab_ids = lab_ids_by_feature(MANAGE_IMPLEMENTATION_SHIPMENTS)
        scope.joins(:shipment).where(shipments: { lab_id: lab_ids })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
