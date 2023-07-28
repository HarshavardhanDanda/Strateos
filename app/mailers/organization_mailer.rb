class OrganizationMailer < ActionMailer::Base
  include ApplicationHelper

  after_action -> { mail.perform_deliveries = Feature.enabled?(:web_notifications) }

  layout 'mail'
  helper :application

  default from: "Strateos <noreply@strateos.com>"

  def shipment_checked_in(shipment)
    @shipment     = shipment
    @containers   = shipment.containers
    @organization = shipment.organization

    recipients = subscribed_users(shipment.organization, :notify_for_shipment_checked_in)
    if shipment.user.try(:notify_for_my_shipment_checked_in)
      recipients << shipment.user.email
    end

    mail(
      to:      recipients,
      subject: "We have received your shipment"
    )
  end

  def intake_kit_shipped(intake_kit)
    @intake_kit = intake_kit
    recipients  = subscribed_users(intake_kit.organization, :notify_for_intake_kit_shipped)

    if intake_kit.user.try(:notify_for_my_intake_kit_shipped)
      recipients << intake_kit.user.email
    end

    mail(
      to:      recipients,
      subject: "Your Intake Kit has shipped"
    )
  end

  def stale_container_notice(stale_containers)
    @containers = stale_containers.map(&:container)
    recipients  = subscribed_users(@containers.first.organization, :notify_for_stale_container)
    mail(
      to:      recipients,
      subject: "Strateos Inventory Scheduled for Discard"
    )
  end

  def started(run)
    run_status(run, :started)
  end

  def completed(run)
    run_status(run, :completed)
  end

  def aborted(run)
    run_status(run, :aborted)
  end

  def canceled(run)
    run_status(run, :canceled)
  end

  def accepted(run)
    run_status(run, :accepted)
  end

  def rejected(run)
    run_status(run, :rejected)
  end

  def run_scheduled(run)
    @run = run
    mail(
      subject: "Run scheduled: #{run.display_name}",
      to:      run.owner.email
    )
  end

  private

  def subscribed_users(org, notification)
    org.users.where({ notification => true }).map(&:email)
  end

  def run_status(run, status)
    @run       = run
    recipients = subscribed_users(run.organization, :notify_for_org_run_status)
    recipients << run.owner.email if run.owner.notify_for_my_run_status

    return if recipients.count == 0

    mail(
      subject:       "Run #{status}: #{run.display_name}",
      to:            recipients.uniq,
      template_name: status
    )
  end
end
