class PaymentMethodPolicy < ApplicationPolicy
  def charge?
    record_within_user_orgs?
  end

  def index?
    true
  end

  def update?
    has_platform_feature(APPROVE_PURCHASE_ORDER)
  end

  def show?
    can_manage_orgs_global? || @record.organization == @organization
  end

  class Scope < Scope
    def resolve
      if can_manage_orgs_global?
        scope
      else
        scope.where(organization_id: @organization.id)
      end
    end
  end
end
