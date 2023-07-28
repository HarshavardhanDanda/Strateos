class DeviceEventPolicy < ApplicationPolicy
  def create?
    has_feature_in_lab(MANAGE_DEVICE_EVENTS, @record.device.work_unit)
  end

  def update?
    has_feature_in_lab(MANAGE_DEVICE_EVENTS, @record.device.work_unit)
  end

  def destroy?
    has_feature_in_lab(MANAGE_DEVICE_EVENTS, @record.device.work_unit)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_DEVICES)
        lab_ids = lab_ids_by_feature(VIEW_DEVICES)
        scope.joins(device: :work_unit).where(work_units: { lab_id: lab_ids })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
