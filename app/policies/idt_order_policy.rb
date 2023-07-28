class IdtOrderPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(MANAGE_IDT_ORDERS)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_IDT_ORDERS)
        lab_ids = lab_ids_by_feature(MANAGE_IDT_ORDERS)
        scope.where(lab: lab_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
