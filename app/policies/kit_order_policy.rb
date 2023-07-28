class KitOrderPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def create?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(MANAGE_KIT_ORDERS)
  end

  def show?
    is_authorized?
  end
  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_KIT_ORDERS)
        scope.where(lab: lab_ids_by_feature(MANAGE_KIT_ORDERS))
      end
    end
  end
end
