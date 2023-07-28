class WorkcellPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    can_view_workcell?
  end

  def can_view_workcell?
    lab_ids = lab_ids_by_feature(VIEW_DEVICES)
    workcell_ids = WorkUnit.where(lab_id: lab_ids).pluck(:workcell_id)
    workcell_ids.include?(@record.id)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_DEVICES)
        lab_ids = lab_ids_by_feature(VIEW_DEVICES)
        workcell_ids = WorkUnit.select(:workcell_id).where(lab_id: lab_ids)
        scope.where(id: workcell_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
