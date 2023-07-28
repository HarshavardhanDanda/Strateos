class RegistrationsController < Devise::RegistrationsController
  respond_to :json
  before_action :set_organization, only: [ :edit ]
  def new
    # Disable new user sign up
    if user_signed_in?
      redirect_to edit
    else
      redirect_to new_user_session_path
    end
  end

  def update
    @user = User.find(current_user.id)

    successfully_updated =
      # Changing email, disabling two factor auth, and changing password requires current password
      if needs_password?(@user, params)
        @user.update_with_password(devise_parameter_sanitizer.sanitize(:account_update))
      else
        # remove the virtual current_password attribute
        # update_without_password doesn't know how to ignore it
        params[:user].delete(:current_password)
        @user.update_without_password(devise_parameter_sanitizer.sanitize(:account_update))
      end

    if successfully_updated
      # Sign in the user bypassing validation in case his password changed
      bypass_sign_in(@user)
      user_preference = user_preference_map()
      # We make calls to Notification service only if the update is regarding user's notification preferences
      if params[:user_preferences].respond_to?('keys') && (params[:user_preferences].keys == user_preference.keys)
        subscription = get_user_subscription(params[:org_id], @user.id)
        org_topics = get_org_type_topics(params[:org_type])
        create_or_delete_user_subscription(
          params[:user_preferences],
          org_topics,
          params[:org_id],
          params[:org_type],
          subscription
        )
      end
      respond_to do |format|
        format.html do
          redirect_to edit_user_registration_path, notice: 'Account updated.'
        end
        format.json { render json: @user }
      end
    else
      respond_to do |format|
        format.html do
          redirect_to edit_user_registration_path, notice: 'Invalid password given.'
        end
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    # prevent destruction
  end

  def edit
    render json: User.find(current_user.id)
  end

  def create
    u = params.require(:user)
    if u[:name]
      u[:first_name], u[:last_name] = u.permit(:name)[:name].split(' ', 2)
    end

    super do |_user|
      flash[:conversion] = { label: "vL-QCMvihgsQ_aT83gM", value: 1 }
    end
  end

  protected

  def after_sign_up_path_for
    "/"
  end

  def after_update_path_for(resource)
    edit_user_registration_path(resource)
  end

  private

  def set_organization
    @organization = current_user.organizations.first
  end

  def needs_password?(user, params)
    return true if params[:user][:email].present? and user.email != params[:user][:email]
    return true if params[:user][:disable_two_factor_auth].present?

    params[:user][:current_password].present?
  end

  def get_subscription_request_payload(topic_id, delivery_channel_id, type, user_id, scope)
    NSClient::CreateSubscription.new({
      topic_id: topic_id,
      delivery_channels: [ delivery_channel_id ],
      type: type,
      user_id: user_id,
      scope: scope
    })
  end

  def get_org_type_topics(org_type)
    response = NOTIFICATION_SERVICE.get_topics_by_org_type(org_type)
    org_topics = {}
    inventory_topics = []
    intake_kit_shipment = []
    shipment = []
    run_scheduled = []
    run_related_topics = []
    response&.content&.map do |topic|
      if topic.name == 'run.scheduled'
        run_scheduled.push(topic)
      elsif topic.name == 'run.status.*'
        run_related_topics.push(topic)
      elsif topic.name.include?('container')
        inventory_topics.push(topic)
      elsif topic.name.include?('intake_kit')
        intake_kit_shipment.push(topic)
      elsif topic.name.include?('shipment')
        shipment.push(topic)
      end
    end

    org_topics[TOPIC_IDENTIFIERS[:inventory]] = inventory_topics
    org_topics[TOPIC_IDENTIFIERS[:intake_kit_shipment]] = intake_kit_shipment
    org_topics[TOPIC_IDENTIFIERS[:run_scheduled]] = run_scheduled
    org_topics[TOPIC_IDENTIFIERS[:run_related_topics]] = run_related_topics
    org_topics[TOPIC_IDENTIFIERS[:shipment]] = shipment
    org_topics
  end

  def get_user_subscription(org_id, user_id)
    subscription = {}
    response = NOTIFICATION_SERVICE.get_subscriptions(org_id, user_id)
    response&.content&.map do |res|
      subscription[res.scope] = res
    end
    subscription
  end

  def user_preference_map
    return {
      'notify_for_my_run_status' => [ TOPIC_IDENTIFIERS[:run_related_topics], 'INDIVIDUAL' ],
      'notify_for_org_run_status' => [ TOPIC_IDENTIFIERS[:run_related_topics], 'ORG' ],
      'notify_for_my_run_schedule' => [ TOPIC_IDENTIFIERS[:run_scheduled], 'INDIVIDUAL' ],
      'notify_for_org_run_schedule' => [ TOPIC_IDENTIFIERS[:run_scheduled], 'ORG' ],
      'notify_for_stale_container' => [ TOPIC_IDENTIFIERS[:inventory], 'ORG' ],
      'notify_for_my_intake_kit_shipped' => [ TOPIC_IDENTIFIERS[:intake_kit_shipment], 'INDIVIDUAL' ],
      'notify_for_intake_kit_shipped' => [ TOPIC_IDENTIFIERS[:intake_kit_shipment], 'ORG' ],
      'notify_for_my_shipment_checked_in' => [ TOPIC_IDENTIFIERS[:shipment], 'INDIVIDUAL' ],
      'notify_for_shipment_checked_in' => [ TOPIC_IDENTIFIERS[:shipment], 'ORG' ]
    }
  end

  def create_or_delete_user_subscription(notification_preference, org_topics, org_id, org_type, subscription)
    user_preference = user_preference_map()
    delivery_channels = NOTIFICATION_SERVICE.get_all_delivery_channels()
    email_delivery_channel = nil
    delivery_channels&.map do |channel|
      email_delivery_channel = channel if channel.name == 'EMAIL'
    end
    scope_subscribed_topic = {}
    scope_subscribed_topic['INDIVIDUAL'] = []
    scope_subscribed_topic['ORG'] = []
    subscription.values.map do |user_subscription|
      subscribed_ids = []
      if !user_subscription.topic_channel_details.empty?
        user_subscription.topic_channel_details.map do |tc|
          subscribed_ids.push(tc.topic_id)
        end
      end
      scope_subscribed_topic[user_subscription.scope] = subscribed_ids
    end

    bulk_subscription_request = []
    notification_preference.each do |key, value|
      if value
        org_topics[user_preference[key][0]].map do |topic|
          next if scope_subscribed_topic[user_preference[key][1]].include?(topic.id)

          subscription_request = get_subscription_request_payload(topic.id, email_delivery_channel.id, 'USER',
                                                                  @user.id, user_preference[key][1])
          bulk_subscription_request.push(subscription_request)
        end
      else
        org_topics[user_preference[key][0]].map do |topic|
          next unless scope_subscribed_topic[user_preference[key][1]].include?(topic.id)

          NOTIFICATION_SERVICE.delete_subscription(
            subscription[user_preference[key][1]].id, topic.id, email_delivery_channel.id
          )
        end
      end
    end
    if !bulk_subscription_request.empty?
      NOTIFICATION_SERVICE.create_user_subscription(org_id, org_type, bulk_subscription_request)
    end
  end
end
