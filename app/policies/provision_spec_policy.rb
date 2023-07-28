class ProvisionSpecPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(VIEW_RUN_DETAILS)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(VIEW_RUN_DETAILS)
        lab_ids = lab_ids_by_feature(VIEW_RUN_DETAILS)
        scope.joins(instruction: :run).where(runs: { lab_id: lab_ids })
      end
    end
  end
end
