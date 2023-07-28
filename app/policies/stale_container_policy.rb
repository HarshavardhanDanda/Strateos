class StaleContainerPolicy < ApplicationPolicy
  def show?
    true
  end

  def index?
    is_authorized?
  end

  def update?
    has_feature_in_lab(MANAGE_STALE_CONTAINERS, @record.container) ||
    (has_feature_in_org(EDIT_CONTAINER) &&
    @record.container.organization == @organization)
  end

  def is_authorized?
    has_feature_in_any_lab(MANAGE_STALE_CONTAINERS)
  end
end
