class WorkUnitPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(VIEW_DEVICES)
  end
  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_DEVICES)
        lab_ids = lab_ids_by_feature(VIEW_DEVICES)
        scope.where(lab_id: lab_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
