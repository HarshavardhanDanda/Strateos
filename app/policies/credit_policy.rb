class CreditPolicy < ApplicationPolicy
  def create?
    can_manage_orgs_global?
  end
end
