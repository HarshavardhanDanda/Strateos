class InvoiceItemPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    can_manage_global_invoices?
  end

  class Scope < Scope
    def has_administration_feature?(user, org)
      permissions = ACCESS_CONTROL_SERVICE.user_acl(user, org)
      permissions && permissions["org_ctx_permissions"]&.include?(ADMINISTRATION)
    end

    def resolve
      if can_manage_orgs_global?
        scope
      else
        org_ids = @user.organizations.select { |org| has_administration_feature?(@user, org) }.pluck(:id)
        scope.where(organization_id: org_ids)
      end
    end
  end
end
