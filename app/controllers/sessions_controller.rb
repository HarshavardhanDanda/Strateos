class SessionsController < Devise::SessionsController
  include ApplicationHelper

  RESERVED_SUBDOMAINS = Set.new([
                                  'admin', 'api', 'container_types', 'containers',
                                  'datasets', 'runs', 'users', 'census', 'rails', 'inventory'
                                ])

  def new
    if admin_signed_in?
      return redirect_to admin_url
    end
    super
  end

  def create
    resource = warden.authenticate!(:scope => resource_name, :recall => "#{controller_path}#new")
    set_flash_message(:notice, :signed_in) if is_navigational_format?
    sign_out(:admin) if admin_signed_in?
    sign_in(resource_name, resource)

    respond_to do |format|
      format.html { respond_with resource, :location => after_sign_in_path_for(resource) }
      format.json do
        return render :json => resource
      end
    end
  end

  def destroy
    # remove user-permission from redis
    if current_user
      org_id = request.headers["X-Organization-Id"]
      redis_key = org_id+'__'+current_user.id
      REDIS_CLIENT.del(redis_key)
    end
    super
  end

  def show
    # Roles: Admin or User
    # Pages: admin, organization, organizationless
    #
    # There are 5 possible cases
    # 1. Admin viewing admin page
    # 2. Admin viewing organization page
    # 3. Admin viewing organizationless page
    # 4. User viewing organization page
    # 5. User viewing organizationless page

    user = current_user_or_admin
    subdomain = params.permit(:subdomain)[:subdomain]

    if subdomain == 'admin' && !admin_signed_in?
      return render json: { redirect_path: admin_session_path }, status: :unauthorized
    elsif user.nil?
      return render json: { redirect_path: user_session_path }, status: :unauthorized
    end

    org_feature_groups = []

    intercom_hash = OpenSSL::HMAC.hexdigest('sha256',
      "#{ENV['INTERCOM_IDENTITY_VERIFICATION_SECRET_FOR_WEB']}", user.email)

    # TODO: Consider using json-api for org info. We could fetch session + org
    # info in parallel on the client.
    org = if RESERVED_SUBDOMAINS.member?(subdomain)
            if admin_signed_in?
              # Case #1, #3
              nil
            else
              # HACK: We include an organization so that links in the navbar
              # are available
              # TODO: Is there onboarding weirdness here? Is there an additional
              # case?
              # Case #5
              org_feature_groups=user.organizations&.first&.feature_groups
              user.organizations&.first&.as_json(Organization::FULL_JSON)
            end
          else
            # Case #2, #4
            organization = Organization.includes(
              collaborators: { collaborating: {}},
              addresses: {}
            ).find_by(subdomain: subdomain)

            if organization.nil? || !organization.user_can_view?(user)
              return render json: {}, status: :bad_request
            end

            org_feature_groups = organization.feature_groups
            organization.as_json(Organization::FULL_JSON)
          end

    session_context = {
      user: user,
      organization: org,
      masquerading: self.try(:masquerading?) || false,
      # TODO: This is bad. Also, appears unnecessary.
      csrf_token: form_authenticity_token,
      # Identity verification hash for Intercom.
      user_intercom_hash: intercom_hash,
      # Feature inherits both user and org features
      feature: Hash[
        (Feature.features_for_user(user) + org_feature_groups).map { |feature| [ feature, true ] }
      ]
    }

    render json: session_context
  end
end
