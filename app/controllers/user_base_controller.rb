class UserBaseController < ApplicationController
  # it's important that the token auth falls back to devise auth, because
  # devise's authenticate_user! is what will actually do the redirect if auth
  # fails. authenticate_user_from_token won't fail loudly if the token isn't
  # present (or is bad), it'll just not sign the user in.
  # i.e. don't put :authenticate_user! before :authenticate_user_from_token.

  before_action :authenticate_from_bearer_token
  before_action :authenticate_user_from_token, unless: -> { @authenticated_from_bearer_token }
  before_action :authenticate_user!, if: lambda {
    !admin_signed_in? and !is_public_url?
  }
  before_action :maybe_force_password_change
  before_action :find_context, :except => [ :render_404 ]
  before_action :ensure_organization, :except => [ :render_404 ]
  around_action :idempotency_key

  def context
    { user_context: pundit_user, action: action_name, custom_params: params[:custom_params],
                    current_organization: @organization }
  end

  def require_password_authorization
    if not current_user.valid_password?(params[:password])
      raise Pundit::NotAuthorizedError "Not authorized"
    end
  end

  def current_user_or_admin_name
    if user_signed_in?
      return current_user.name
    elsif admin_signed_in?
      return current_admin.name
    end
  end

  def find_project_context
    @project = Project.find_by_id!(params[:project_id])
    authorize(@project, :show?)
  end

  def find_context
    return if params[:invitation_token]

    org_id_from_header = request.headers["X-Organization-Id"]

    org_id =
      if user_signed_in? && org_id_from_header
        org_id_from_header
      elsif request.parameters["controller"] == "organizations" and params[:id]
        params[:id]
      elsif params[:organization_id]
        params[:organization_id]
      elsif admin_signed_in? && org_id_from_header
        org_id_from_header
      else
        begin
          current_user.organizations.first.subdomain
        rescue StandardError
          nil
        end
      end

    if org_id
      @organization = Organization.find_by_id_or_subdomain!(org_id)
      authorize(@organization, :show?)
    end

    if params[:project_id]
      find_project_context
    end

    container_id = params[:container_id] || params[:sample_id]
    if container_id
      @container = Container.with_deleted.find(container_id)
    end

    # Set Current context
    Current.user = current_user || current_admin
    Current.organization = @organization
    Current.permissions = pundit_user.permissions
  end

  def ensure_organization
    if request.path == '/no-organization-warning'
      return
    end

    if user_signed_in? && (current_user.organizations.count == 0 or (ENV['ACS_ENABLED'] == 'true' and
          request.headers["X-Organization-Id"].nil?))
      redirect_to "/no-organization-warning"
    end
  end

  def extract_signature!

    if request.headers['authorization'].nil?
      raise "Missing RSA Signature: No authorization header."
    end

    # Pull out the signature text from the authorization header
    signature_match = request.headers['authorization'].match(/Signature\ ((?:[^=]+=".*?",?)+)/)
    if signature_match.nil?
      raise "Missing RSA Signature: Authorization header is present, but does not contain a signature."
    else
      signature_text = signature_match[1]
    end

    # Pull out signature_fields from the signature
    kv_pairs = signature_text.split(/,/)
    signature_fields = kv_pairs.each_with_object({}) do |pair, hash|
      match = /^([^=]+)="(.*)"$/.match(pair.strip)
      key = match[1]
      value = match[2]
      hash[key] = value
    end

    # Verify expected signature fields are present
    expected_signature_fields = [ "keyId", "algorithm", "headers", "signature" ]
    missing_fields = expected_signature_fields - signature_fields.keys

    if not missing_fields.empty?
      raise "Malformed RSA Signature: Signature is missing field(s): #{missing_fields.join(',')}"
    elsif signature_fields["algorithm"] != "rsa-sha256"
      # we only support rsa-sha256
      raise "Malformed RSA Signature: Signature algorithm must be \"rsa-sha256\""
    end

    # Pull out and verify that requird headers are signed, depending on request type
    header_names = signature_fields['headers'].split(" ")
    expected_headers = [ "(request-target)", "date", "host" ]
    if [ "PUT", "POST", "PATCH" ].include?(request.method.upcase)
      expected_headers += [ "digest", "content-length" ]
    end
    missing_headers = expected_headers - header_names

    if not missing_headers.empty?
      raise "Malformed RSA Signature: Signature is missing headers(s): #{missing_headers.join(',')}"
    end

    # If a signed digest header was included, make sure it matches the request body
    if header_names.include?('digest')
      match = /^SHA-256=(.*)/.match(request.headers['digest'])
      if match.nil?
        raise "Unverifiable RSA Signature: Digest header must be of the format /^SHA-256=(.*)/ when using RSA signing"
      end

      digest = Base64.strict_decode64(match[1])
      if digest != OpenSSL::Digest::SHA256.digest(request.raw_post)
        raise "Unverifiable RSA Signature: Digest header does not match body content"
      end
    end

    # Construct the signing string which the signature will be validated against
    signing_string = header_names.map { |header_name|
      if header_name == "(request-target)"
        "#{header_name}: #{request.method.downcase} #{request.original_fullpath}"
      else
        "#{header_name}: #{request.headers[header_name.to_s]}"
      end
    }.join("\n")

    {
      :signature => signature_fields['signature'],
      :date => Time.rfc2822(request.headers['date']),
      :key_id => signature_fields["keyId"],
      :signing_string => signing_string
    }
  end

  def updating_public_key?
    action_name == 'update_public_key' && controller_name == 'users'
  end

  def validate_signature(authenticated_user)
    # Validate signatures for users, ignore for admins
    # Admins are not issued tokens, and as such are not able to make API requests
    # Requests from Users including an authorization header are expected to have valid signatures
    # Users who belong to Orgs which have opted to enforce request signing are also expected to have valid signatures
    # Updating RSA key does not require signature validation if not already configured.
    if updating_public_key? && !authenticated_user.request_signing_configured?
      nil
    else
      user_must_sign = authenticated_user.any_org_feature_groups_include?('enforce_request_signing')
      has_auth_header = !request.headers['authorization'].nil?

      if user_must_sign || has_auth_header
        begin
          signature_info = self.extract_signature!
        rescue StandardError => e
          render :status => :bad_request, :plain => e.message
          return
        end

        begin
          authenticated_user.validate_signature!(**signature_info)
        rescue StandardError => e
          render :status => :unauthorized, :plain => e.message
          return
        end
      end
    end
  end

  # Authenticate a user from a Bearer/OAuth token
  # If a bearer token is provided (as an Auth header), we will attempt to verify it
  # and fail/return unauthorized if token verification fails.
  #
  # Note: The user email must still be provided. In the future, we should be setting the
  # tenant/org context and not need a user email at all, as this is client_credentials auth,
  # as opposed to user/pw auth.
  def authenticate_from_bearer_token
    email = request.headers['X-User-Email']
    user = User.find_by_email(email)
    return if user.nil?

    authorization_header = request.headers['authorization']
    return unless has_bearer_token(authorization_header)

    begin
      OAuthService.verify(authorization_header.split(' ')[1])
      request.env["devise.skip_trackable"] = true
      sign_in(user, store: false)
      @authenticated_from_bearer_token = true
    rescue StandardError => e
      render :status => :unauthorized, :plain => "Unauthorized. Bearer token error: #{e.message}"
    end
  end

  def has_bearer_token(authorization_header)
    !authorization_header.nil? && authorization_header.start_with?('Bearer')
  end

  def authenticate_user_from_token
    # Check old-style API keys. Cribbed from https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    email = request.headers['X-User-Email']
    token = request.headers['X-User-Token']

    return if email.nil? || token.nil?

    # this is useful for other before_actions
    request.env['is_api_request'] = true

    # Authenticate using the User or Admin "users"
    # Does minimal DB queries.
    user  = User.find_by_email_and_validate_token(email, token)
    admin = user ? nil : Admin.find_by_email_and_validate_token(email, token)

    authenticated_user = user || admin

    if authenticated_user

      validate_signature(authenticated_user)

      # Sign in using token should not be tracked by Devise trackable
      # See https://github.com/plataformatec/devise/issues/953
      request.env["devise.skip_trackable"] = true

      # {store:false} means the user is not actually stored in the session and
      # a token is needed for every request.
      sign_in(authenticated_user, store: false)
    end
  end

  private

  def is_public_url?
    false
  end

  # Renders our react application, which will route and fetch data via ajax.
  # Renders html file directly, which is dynamically generated by webpack
  def render_react_app
    render file: Rails.public_path.join('dist', 'main_index.html'), layout: false, content_type: 'text/html'
  end

end
