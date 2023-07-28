class LocationPolicy < ApplicationPolicy
  def index?
    has_feature_in_any_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def show?
    has_feature_in_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def create?
    has_feature_in_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def update?
    has_feature_in_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def move?
    has_feature_in_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def destroy?
    has_feature_in_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def manage_tisos?
    has_feature_in_lab(MANAGE_TISOS)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_CONTAINER_LOCATIONS)
        labs = lab_ids_by_feature(MANAGE_CONTAINER_LOCATIONS)
        scope.where(lab: labs)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
