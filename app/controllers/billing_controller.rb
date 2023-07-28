class BillingController < UserBaseController
  before_action :is_super_admin

  def past_invoices
    billable_org_ids = InvoiceItem.finalized.pluck(:organization_id).uniq
    billable_orgs    = Organization.exclude_internal_users.where(id: billable_org_ids)

    render(json: Invoice.where(organization_id: billable_orgs.map(&:id))
                        .where.not(charged_at: nil)
                        .as_json(Invoice.short_json))
  end
end
