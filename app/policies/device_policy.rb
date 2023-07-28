class DevicePolicy < ApplicationPolicy
  def index?
    has_feature_in_any_lab(VIEW_DEVICES)
  end

  def show?
    true
  end

  def create?
    has_feature_in_lab(MANAGE_DEVICES)
  end

  def update?
    has_feature_in_lab(MANAGE_DEVICES)
  end

  def destroy?
    has_feature_in_lab(MANAGE_DEVICES)
  end
  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_DEVICES)
        lab_ids = lab_ids_by_feature(VIEW_DEVICES)
        scope.joins(:work_unit).where(work_units: { lab_id: lab_ids })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
