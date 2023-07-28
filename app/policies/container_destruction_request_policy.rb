class ContainerDestructionRequestPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(MANAGE_CONTAINER_DESTRUCTION_REQUESTS)
  end
  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_CONTAINER_DESTRUCTION_REQUESTS)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINER_DESTRUCTION_REQUESTS)
        scope.joins(:container).where(containers: { lab: lab_ids })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
