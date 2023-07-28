class BillingContactMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  layout 'mail'

  def confirmation_instructions(record, token, opts = {})
    opts[:subject] = "Confirm your billing email address"
    super
  end

  def invoice_created(invoice)
    @invoice = invoice
    confirmed_organization_billing_emails =
      invoice.billing_contacts.where.not(confirmed_at: nil).pluck(:email)

    recipients =
      if confirmed_organization_billing_emails.blank?
        invoice.contact_user.email
      else
        confirmed_organization_billing_emails
      end

    if invoice.xero_invoice.try(:pdf) # so that tests will pass
      attachments["Strateos Invoice #{invoice.xero_invoice_number}.pdf"] = invoice.xero_invoice.pdf
    end

    mail(
      subject: "Strateos Invoice for #{invoice.month}",
      to: recipients,
      from: "Strateos Billing <accountsreceivable@strateos.com>"
    )
  end
end
