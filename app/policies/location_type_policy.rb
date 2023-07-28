class LocationTypePolicy < ApplicationPolicy
  def index?
    has_feature_in_any_lab(MANAGE_CONTAINER_LOCATIONS)
  end

  def show?
    has_feature_in_any_lab(MANAGE_CONTAINER_LOCATIONS)
  end
end
