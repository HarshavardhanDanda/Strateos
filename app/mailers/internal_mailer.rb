class InternalMailer < ActionMailer::Base
  helper :application
  include Devise::Controllers::UrlHelpers
  layout 'mail'

  default from: "Strateos <noreply@strateos.com>"

  BILLING      = 'Strateos Billing      <accountsreceivable@strateos.com>'
  BOOKINGS     = 'Strateos Bookings     <bookings@strateos.com>'
  SALES        = 'Strateos Sales        <sales@strateos.com>'
  STAGING      = 'Strateos Staging      <staging@strateos.com>'
  SUPPORT      = 'Strateos Support      <support@strateos.com>'

  def implementation_request(req)
    @req = req
    mail(
     subject: "Protocol Implementation Request: #{req.organization.name}",
     to: SALES,
     from: req.user.email
    )
  end

  def recent_purchase_orders(pos)
    @pos = pos
    mail(
      subject: "Recent Purchase Orders",
      to: BOOKINGS,
      from: BILLING
    )
  end

  def support_ticket_created(ticket)
    @ticket = ticket
    mail(
      subject: "Support Request: Run #{ticket.run.id}",
      to: SUPPORT,
      from: ticket.user.email
    )
  end

  def run_created(run)
    @run = run
    mail(
      subject: "Run created: #{run.display_name}",
      to: run.organization.test_account ? STAGING : User.find(run.owner_id).email
    )
  end

end
