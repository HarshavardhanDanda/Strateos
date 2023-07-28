class UserMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  layout 'mail'

  default from: "Strateos <noreply@strateos.com>"

  def confirmation_instructions(record, token, opts = {})
    opts[:subject] = "Confirm your Strateos account"
    super
  end

  def collaboration(inviting_user, invited_user, organization)
    @inviting_user = inviting_user
    @invited_user  = invited_user
    @organization  = organization
    mail(
      subject: "Join #{organization.name} organization on Strateos",
      to: invited_user.email
    )
  end

  def support_ticket_acknowledge(ticket)
    @ticket = ticket
    mail(
      subject: "Support Request Received: #{ticket.run.display_name}",
      to: ticket.user.email
    )
  end
end
