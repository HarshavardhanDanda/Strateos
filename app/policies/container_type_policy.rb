class ContainerTypePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    can_manage_orgs_global?
  end
end
