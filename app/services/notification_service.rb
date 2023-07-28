require 'net/http'
require 'uri'
require 'notification_service_client'

class NotificationService
  def initialize(base_url)
    NSClient.configure do |config|
      # Since NS URL is hardcoded to localhost:8086 in NS Client, configuring ApiClient to use scheme and host
      config.host = base_url
      config.scheme = base_url.sub(/:\/\/.*/, '')
      config.server_index = nil
    end
    @event_api = NSClient::EventApi.new
    @url_helpers = Rails.application.routes.url_helpers
    @subscription_api = NSClient::SubscriptionApi.new
    @topic_api = NSClient::TopicApi.new
    @delivery_channel_api = NSClient::DeliveryChannelApi.new
  end

  def get_subscriptions(org_id, user_id = nil)
    if user_id
      @subscription_api.get_all_subscriptions_by_org(org_id, { filter_user_id: user_id })
    else
      @subscription_api.get_all_subscriptions_by_org(org_id)
    end
  rescue StandardError => e
    Rails.logger.error "Unable to get subscriptions of user: #{e}"
  end

  def get_topics_by_org_type(org_type)
    response = @topic_api.get_all_topics_by_org_type(org_type, { page_size: 10_000 })
    return response
  rescue StandardError => e
    Rails.logger.error "Unable to get topics of this org_type: #{e}"
  end

  def create_user_subscription(org_id, org_type, bulk_subscriptions)
    response = @subscription_api.create_subscriptions(org_id, org_type, bulk_subscriptions)
    return response
  rescue StandardError => e
    Rails.logger.error "Unable to create user subscription/save user preferences: #{e}"
  end

  def delete_subscription(subscription_id, topic_id, channel_id)
    response = @subscription_api.delete_subscription_for_topic_and_channel(subscription_id, topic_id, channel_id)
    return response
  rescue StandardError => e
    Rails.logger.error "Unable to remove user subscription/save user preferences: #{e}"
  end

  def delete_user_subscription(user_id, org_ids)
    response = @subscription_api.delete_subscription_for_user_and_organizations(user_id, org_ids)
    return response
  rescue StandardError => e
    Rails.logger.error "Unable to remove user subscription: #{e}"
  end

  def get_all_delivery_channels
    response = @delivery_channel_api.get_all_delivery_channels()
    return response
  rescue StandardError => e
    Rails.logger.error "Unable to fetch delivery channels: #{e}"
  end

  def run_created(run)
    subject = "Run created: #{run.display_name}"
    description = "View Created Run"
    event_data = create_event_payload(run, RUN_STATUS_CREATED, subject, description)
    items = run.quote['items'].deep_dup
    if not items.nil?
      items.each do |item|
        item['cost'] = ActionController::Base.helpers.number_to_currency(item['cost'])
      end
      event_data["payload"]["run"]["has_items"] = true
      event_data["payload"]["run"]["quote"] = {}
      event_data["payload"]["run"]["quote"]["items"] = items
      event_data["payload"]["run"]["total_cost"] = ActionController::Base.helpers.number_to_currency(run.total_cost)
    end
    send_event(event_data)
  end

  def run_aborted(run)
    subject = "Run aborted: #{run.display_name}"
    description = "View Aborted Run"
    event_data = create_event_payload(run, RUN_STATUS_ABORTED, subject, description)
    event_data["payload"]["run"]["aborted_at"] = run.aborted_at.strftime('%b %d, %Y')
    send_event(event_data)
  end

  def run_accepted(run)
    subject = "Run accepted: #{run.display_name}"
    description = "View Run"
    event_data = create_event_payload(run, RUN_STATUS_ACCEPTED, subject, description)
    send_event(event_data)
  end

  def run_canceled(run)
    subject = "Run canceled: #{run.display_name}"
    description = "View Cancelled Run"
    event_data = create_event_payload(run, RUN_STATUS_CANCELED, subject, description)
    send_event(event_data)
  end

  def run_completed(run)
    subject = "Run completed: #{run.display_name}"
    description = "View Completed Run"
    event_data = create_event_payload(run, RUN_STATUS_COMPLETED, subject, description)
    send_event(event_data)
  end

  def run_scheduled(run)
    subject = "Run scheduled: #{run.display_name}"
    description = "View Run"
    event_data = create_event_payload(run, RUN_SCHEDULED, subject, description)
    event_data["payload"]["run"]["scheduled_to_start_at"] = run.scheduled_to_start_at
    send_event(event_data)
  end

  def run_started(run)
    subject = "Run started: #{run.display_name}"
    description = "View Run"
    event_data = create_event_payload(run, RUN_STATUS_STARTED, subject, description)
    send_event(event_data)
  end

  def run_rejected(run)
    subject = "Run rejected: #{run.display_name}"
    description = "View Run"
    event_data = create_event_payload(run, RUN_STATUS_REJECTED, subject, description)
    event_data["payload"]["run"]["reject_reason"] = run.reject_reason
    event_data["payload"]["run"]["reject_description"] = run.reject_description
    send_event(event_data)
  end

  def intake_kit_shipped(intake_kit)
    address = Address.find(intake_kit.address_id)
    notes = IntakeKit.find(intake_kit.id)&.notes
    root_path = Rails.application.routes.default_url_options
    organization = Organization.find(intake_kit.organization_id)
    intake_kit_shipment_url = "#{root_path[:protocol]}://#{root_path[:host]}/" +
                              "#{organization.subdomain}/shipments/intake_kits?in_transit_to_you=true"
    event_data = {
      "topicName" => INTAKE_KIT_SHIPPED,
      "organizationId" => intake_kit.organization_id,
      "payload" => {
        "subject" => "Your Intake Kit has shipped",
        "intake_kit" => {
          "organization" => {
            "name": organization.name
          },
          "tracking_number" => intake_kit.tracking_number,
          "order_date" => DateTime.parse(intake_kit.created_at.to_s).strftime("%B %d, %Y"),
          "order_total" => InvoiceItem.find_by(id: intake_kit.invoice_item_id)&.charge&.to_f,
          "owner" => {
            "id" => intake_kit.user.try('id')
          }
        },
       "intake_kit_shipment_url" => intake_kit_shipment_url,
       "address" => {
         "attention" => address&.attention,
         "street" => address&.street,
        "city" => address&.city,
         "country" => address&.country,
        "zipcode" => address&.zipcode
       },
       "notes": notes
      }
    }
    send_event(event_data)
  end

  def shipment_checked_in(shipment)
    organization = Organization.find(shipment.organization_id)
    root_path = Rails.application.routes.default_url_options
    inventory_url = "#{root_path[:protocol]}://#{root_path[:host]}/" +
                              "#{organization.subdomain}/inventory/samples"
    container_dtos = shipment.containers.map do |container|
      { "id" => container.id, "label" => container.label }
    end
    event_data = {
      "topicName" => SHIPMENT_CHECKED_IN,
      "organizationId" => shipment.organization_id,
      "payload" => {
        "subject" => "We have received your shipment",
        "organization" => {
          "name": organization.name
        },
        "shipment" => {
          "id" => shipment.id,
          "name" => shipment.name,
          "label" => shipment.label,
          "owner" => {
            "id" => shipment.user.try('id')
          },
          "link" => inventory_url
        },
        "containers" => container_dtos,
        "edit_user_registration_url" => @url_helpers.edit_user_registration_url

      }
    }
    send_event(event_data)
  end

  def stale_container_notice(org_id, stale_containers)
    organization = Organization.find(org_id)
    root_path = Rails.application.routes.default_url_options
    containers = stale_containers.map(&:container)
    container_dtos = containers.map do |container|
      { "id" => container.id, "label" => container.label }
    end
    inventory_url = "#{root_path[:protocol]}://#{root_path[:host]}/" +
                              "#{organization.subdomain}/inventory/samples"
    event_data = {
      "topicName" => CONTAINER_STALE,
      "organizationId" => org_id,
      "payload" => {
        "subject" => "Strateos Inventory scheduled for discard",
        "organization_name" => containers.first.organization.name,
        "containers" => container_dtos,
        "inventory_url" => inventory_url
     }
    }
    send_event(event_data)
  end

  private

  def create_event_payload(run, topic_name, subject, description)
    org = run.project.organization
    starred_by = []
    favorite_records = Favorite.where(favorable_type: 'Project', favorable_id: run.project.id)
    favorite_records.map do |favorite|
      starred_by.push(favorite.user_id)
    end
    target_url = @url_helpers.organization_project_run_url(org.subdomain, run.project.id, run.id)
    { "topicName" => topic_name,
      "organizationId" => run.project.organization.id,
      "payload" => {
        "subject" => subject,
        "run" => {
          "display_name" => run.display_name,
          "organization" => {
            "name" => org.name
          },
          "owner" => {
            "id" => run.owner.try('id'),
            "name" => run.owner.try('name')
          },
          "project" => {
            "id" => run.project.id,
            "starred_by" => starred_by
          }
        },
        "name" => "View Run",
        "description" => description,
        "target_url" => target_url,
        "organization_project_run_url" => target_url
      }}
  end

  def send_event(event_data)
    event_data["source"] = "WEB"
    event_data["eventTimestamp"] = Time.now
    event_data["payload"]["edit_user_registration_url"] = @url_helpers.edit_user_registration_url
    begin
      @event_api.create_event(event_data)
    rescue StandardError => e
      Rails.logger.error "Unable to send notification event: #{e}"
    end
  end
end

class MockNotificationService < NotificationService

  private

  def send_event(event_data)
  end

end
