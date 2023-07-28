class ApplicationController < ActionController::Base
  include ErrorHandling
  include Pundit

  # Get either the logged in admin or the user to be set in the authorization context.
  # Order matters to allow masquerading admins all access.
  def pundit_user
    user = current_user || current_admin
    permissions = ACCESS_CONTROL_SERVICE.user_acl(user, @organization)
    UserContext.new(user, @organization, permissions)
  end

  def lab_ids_by_feature(feature)
    permissions = ACCESS_CONTROL_SERVICE.user_acl(current_user, @organization)
    labs = permissions && permissions["lab_ctx_permissions"]&.select { |lab| lab["features"].include?(feature) }
    labs&.map { |lab| lab["labId"] }
  end

  def has_feature_in_any_lab(feature)
    permissions = ACCESS_CONTROL_SERVICE.user_acl(current_user, @organization)
    permissions && !permissions["lab_ctx_permissions"]&.find { |lab| lab["features"].include?(feature) }.nil?
  end

  def has_feature_in_org?(feature, organization = @organization)
    permissions = ACCESS_CONTROL_SERVICE.user_acl(current_user, organization)
    permissions && permissions["org_ctx_permissions"].include?(feature)
  end

  def is_consumer_of_any_labs(org, lab_ids)
    (org.labs.map(&:id) & lab_ids).any?
  end

  def has_platform_feature(feature)
    permissions = pundit_user.permissions
    permissions.present? && permissions["platform_ctx_permissions"].present? &&
      permissions["platform_ctx_permissions"].include?(feature)
  end

  def has_platform_features_in_org?(user: current_user, organization: @organization)
    permissions = ACCESS_CONTROL_SERVICE.user_acl(user, organization)
    permissions.present? && permissions["platform_ctx_permissions"].any?(String)
  end

  def is_super_admin
    unless current_user.feature_groups.include?('admin_sunset') &&
      @organization.feature_groups.include?('admin_sunset')
      raise Pundit::NotAuthorizedError
    end
  end

  def lab_ids_by_features(features)
    labs = @permissions && @permissions["lab_ctx_permissions"]&.select do |lab|
      (lab["features"] & features).size == features.size
    end
    labs&.map { |lab| lab["labId"] }
  end

  def get_consumer_orgs_of_lab_with_feature(feature)
    consumer_org_ids = []
    lab_ids = lab_ids_by_feature(feature) || []
    lab_ids.each do |lab_id|
      consumer_org_ids.concat(Lab.find(lab_id).organizations.map(&:id))
    end
    return consumer_org_ids.uniq
  end

  def consuming_orgs_of_user_allowed_labs
    permissions = ACCESS_CONTROL_SERVICE.user_acl(current_user, @organization)
    lab_ids = permissions["lab_ctx_permissions"]&.map { |lab| lab["labId"] }
    org_ids = []
    lab_ids&.each do |lab_id|
      org_ids.concat(Lab.find(lab_id).organizations.map(&:id))
    end
    org_ids
  end

  def authorized?(record, method)
    authorize(record, method)
    return true
  rescue Pundit::NotAuthorizedError
    return false
  end

  before_bugsnag_notify :add_user_info_to_bugsnag

  # Our API like endpoints don't pass a CSRF token and will fail so for now use the null_session
  # which allows the request to continue onwards.
  # https://stackoverflow.com/questions/42795288/rails-5-api-protect-from-forgery
  #
  # TODO: Brakeman claims this is bad.  Figure out alternatives later.
  protect_from_forgery :with => :null_session

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :check_client_version

  def after_sign_in_path_for(resource)
    if resource.class.name == 'Admin'
      return (stored_location_for(resource) || admin_url)
    end

    flash.delete :alert

    user = resource

    if warden.session(resource_name)[TwoFactorAuthentication::NEED_AUTHENTICATION]
      if user.two_factor_auth_enabled?
        "/users/two_factor_authentication"
      else
        "/users/two_factor_authentication/register"
      end
    elsif user.organizations.count == 0
      "/no-organization-warning"
    else
      stored_location_for(user) || url_for(user.organizations.first)
    end
  end

  def after_sign_out_path_for(resource)
    if resource == :admin
      new_admin_session_path
    else
      super
    end
  end

  def masquerading?
    session[:admin_id].present?
  end
  helper_method :masquerading?

  def deref
    gid        = params[:gid]
    prefix_end = gid.index("1")

    if !prefix_end
      raise ActiveRecord::RecordNotFound
    end

    prefix = gid[0..prefix_end - 1]

    url =
      case prefix
      when "org"
        org = Organization.find(gid)
        authorize(org, :show?)
        organization_url(org)
      when "p"
        p = Project.find(gid)
        authorize(p, :show?)
        organization_project_url(p.organization, gid)
      when "r"
        r = Run.find(gid)
        authorize(r, :show?)
        organization_project_run_url(r.project.organization, r.project.id, gid)
      when "i"
        i = Instruction.find(gid)
        authorize(i, :show?)
        organization_project_run_url(i.run.project.organization, i.run.project.id, i.run_id)
      when "d"
        d = Dataset.find(gid)

        authorize(d, :show?)

        run     = d.run
        project = run.project
        org     = project.organization

        if d.instruction_id
          inst = d.instruction
          ref_dataset_organization_project_run_url(org, project.id, run.id, inst.data_name)
        else
          analysis_dataset_organization_project_run_url(org, project.id, run.id, d.id)
        end
      when "u"
        u = User.find(gid)
        authorize(u, :show?)
        user_url(gid)
      when "aq"
        aq = Aliquot.find(gid)
        authorize(aq, :show?)
        container_type = aq.container.container_type
        human_well     = container_type.human_well aq.well_idx
        aliquot_organization_inventory_sample_url(aq.organization, aq.container_id, human_well)
      when "ct"
        ct = Container.with_deleted.find(gid)
        authorize(ct, :show?)
        organization_inventory_sample_url(ct.organization, gid)
      when "pk"
        package = Package.find(gid)

        authorize(package, :show?)

        organization_package_url(package.organization, gid)
      when "re"
        release = Release.find(gid)

        authorize(release, :show?)

        package = release.package
        org = package.organization

        organization_package_release_url(org, package.id, gid)
      when "pr"
        protocol = Protocol.find(gid)

        authorize(protocol, :show?)
        organization_protocol_url(protocol.package.organization, gid)
      when "nb"
        notebook = Notebook.find(gid)

        authorize(notebook, :show?)

        project = notebook.project
        org = project.organization

        organization_project_notebook_url(org, project.id, gid)
      else
        raise ActiveRecord::RecordNotFound
      end

    redirected_url = [ url, '?', params.to_unsafe_h.to_query ].join
    redirect_to(redirected_url)
  end

  private

  ###
  # Used to ensure that clients have modern enough versions. Specifically this
  # mechanism can be used to force an old client to update when breaking changes
  # are made
  ###
  def check_client_version
    required_major, required_minor, required_build = TXPY_MIN_VERSION.split(".").map(&:to_i)

    if request.headers["user-agent"] =~ %r{^txpy/([^\s]+).*}
      major, minor, build = Regexp.last_match[1].split('.').map(&:to_i)

      if major < required_major || minor < required_minor || build < required_build
        msg = "TxPy version must be at least #{TXPY_MIN_VERSION}"
        render :json => { error: "client_outdated", message: msg, min_version: TXPY_MIN_VERSION },
:status => :bad_request
      end
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(
      :sign_up, keys: [
        :first_name, :last_name, :email,
        :current_password, :password, :password_confirmation
      ]
    )

    devise_parameter_sanitizer.permit(
      :account_update, keys: [
        :name, :email, :current_password, :password, :password_confirmation, :disable_two_factor_auth,
        :enable_two_factor_auth,
        :notify_for_intake_kit_shipped,
        :notify_for_my_intake_kit_shipped,
        :notify_for_my_run_schedule,
        :notify_for_my_run_status,
        :notify_for_my_shipment_checked_in,
        :notify_for_org_run_schedule,
        :notify_for_org_run_status,
        :notify_for_shipment_checked_in,
        :notify_for_stale_container
      ]
    )

    devise_parameter_sanitizer.permit(
      :accept_invitation, keys: [
        :first_name, :last_name, :email, :password, :password_confirmation, :invitation_token
      ]
    )
  end

  def add_user_info_to_bugsnag(notif)
    if user_signed_in?
      notif.user = {
        type: "user",
        email: current_user.email,
        name: current_user.name,
        id: current_user.id
      }
    elsif admin_signed_in?
      notif.user = {
        type: "admin",
        email: current_admin.email,
        name: current_admin.name,
        id: current_admin.id
      }
    end
  end

  # Converts a container parameter of the form
  #   {
  #     barcode: 'asdf',
  #     ...
  #     aliquots: {'0' =>  {volume_ul: 0}}
  #   }
  #
  #   To [container_attrs, aliquots_attrs] with the containertype added,
  #   and unpermitted fields removed.
  def sanitize_container_params(cparams,
                                permitted_container: [ :barcode, :label, :storage_condition,
                                                      :container_type, :location_id,
                                                      :orderable_material_component_id ],
                                permitted_aliquot: [ :well_idx, :volume_ul, :mass_mg, :resource_id ])

    c_attrs                  = cparams.permit(permitted_container).to_h
    c_attrs[:container_type] = ContainerType.find_by_shortname(c_attrs[:container_type])

    # All this craziness is required because strong params doesn't allow hash with unknow keys.
    a_attrs = cparams.fetch(:aliquots, {})
    a_attrs = a_attrs.transform_values { |v| v.slice(*permitted_aliquot) }.to_unsafe_h

    [ c_attrs, a_attrs ]
  end

  def idempotency_key
    idempotency_key = request.headers['Idempotency-Key']

    if !request.post? || idempotency_key.nil?
      # execute the request as usual
      return yield
    end

    namespace = (current_user || current_admin).id
    redis_key = "__idempotency-key_#{namespace}_#{idempotency_key}"
    data      = REDIS_CLIENT.get(redis_key)

    if data.nil?
      # execute the request
      yield
      # only store successful POSTs
      if [ 200, 201 ].include?(response.status)
        payload = {
          idempotency_key: idempotency_key,
          request_at: Time.now,
          request: {
            body: request.body.set_encoding('utf-8').string
          },
          response: {
            status: response.status,
            headers: response.headers,
            body: response.body
          }
        }.to_json
        one_day = 60 * 60 * 24
        REDIS_CLIENT.multi do
          REDIS_CLIENT.set(redis_key, payload)
          REDIS_CLIENT.expire(redis_key, one_day)
        end
      end
    else
      stored = JSON.parse(data)
      # convert to identical data type as stored request body
      req_body = request.body.set_encoding('utf-8').string

      if req_body != stored['request']['body']
        render json: {
          error: "Your request body does not match the original request for key: #{idempotency_key}"
        }, status: :unprocessable_entity
      else
        stored['response']['headers'].each do |header, value|
          response.headers[header] = value
        end
        render body: stored['response']['body'], status: stored['response']['status']
      end
    end
  end

  # security filter to force updating password on flagged Users and Admins
  def maybe_force_password_change
    # No need to force reregistration on api requests
    return if request.env['is_api_request']

    # Only handle GET requests
    return if request.method != 'GET'

    user        = nil
    ignore_path = nil

    if self.is_a?(UserBaseController)
      user = current_user
      ignore_path = edit_user_password_path
    else
      user = current_admin
      ignore_path = edit_admin_password_path
    end

    if !user.nil? && user.force_change_password && !devise_controller? && request.path != ignore_path
      token = user.create_password_reset_token

      url = edit_user_password_path(reset_password_token: token)

      flash[:alert] = "Your password has expired. Must change your password."

      # the password reset path requires the user to be signed out or else
      # there is an infinite loop.
      sign_out(user)

      redirect_to(url)
    end
  end
end
