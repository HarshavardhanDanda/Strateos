class InvoicePolicy < ApplicationPolicy
  def index?
    can_view_global_invoices?
  end

  def show?
    can_view_global_invoices? || @record.organization == @organization
  end

  def create?
    can_manage_global_invoices?
  end

  def update?
    can_manage_global_invoices?
  end

  def manage?
    return false if @record.respond_to?(:class_name)

    @record.organization.admin?(@user)
  end

  def generate_netsuite_invoice?
    can_manage_global_invoices?
  end

  class Scope < Scope
    def resolve
      if has_platform_feature(VIEW_INVOICES_GLOBAL)
        scope
      elsif user_labs.any?
        lab_consumers = LabConsumer.where(lab_id: user_labs)
        org_ids = lab_consumers.pluck(:organization_id).uniq
        scope.where(organization_id: org_ids)
      else
        scope.where(organization_id: @organization.id)
      end
    end
  end
end
