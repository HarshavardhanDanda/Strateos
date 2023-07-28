class NotificationPolicy < ApplicationPolicy
  def index?
    can_manage_orgs_global?
  end

  def show?
    can_manage_orgs_global?
  end

  def create?
    can_manage_orgs_global?
  end
end
