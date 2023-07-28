require 'uri'

class UsersController < UserBaseController

  def index
    authorize(@organization,:member?)
    json_type =
      if params[:collaborator_json]
        User.collaborator_json
      else
        User.public_json
      end
    user_ids = params[:user_ids]
    users = User.where(id: user_ids)
    render json: users.as_json(json_type)
  end

  def fetch_subscriptions
    response = NOTIFICATION_SERVICE.get_subscriptions(params[:org_id], params[:filter][:userId])
    render json: response
  end

  def fetch_topics_of_org_type
    response = NOTIFICATION_SERVICE.get_topics_by_org_type(params[:org_type])
    render json: response
  end

  def show
    @user = User.find params[:id]
    authorize(@user, :show?)

    json_type =
      if params[:collaborator_json]
        User.collaborator_json
      elsif params[:full_json]
        authorize(current_user, :search?)
        User.full_json
      else
        User.public_json
      end

    render json: @user.as_json(json_type)
  end

  def destroy
    @user = User.find params[:id]
    authorize(@user, :can_remove_users_from_platform?)
    if @user.destroy
      head :ok
    else
      render json: { errors: @user.errors }, status: :unprocessable_entity
    end
  end

  def unlock
    @user = User.find(params[:user_id])
    authorize(@user, :administer?)

    @user.second_factor_attempts_count = 0

    if @user.unlock_access!
      head :ok
    else
      render json: @user.errors, status: :unprocessable_entity
    end
  end

  def api_rotate
    @user = User.find(params[:user_id])
    authorize(@user, :update?)

    @user.rotate_api_key
    render json: @user
  end

  def update_public_key
    params.require(:rsa_public_key)
    @user = User.find(params[:user_id])
    authorize(@user, :update?)

    begin
      @user.rsa_public_key = params[:rsa_public_key]
    rescue => e
      render json: { errors: [ e.message ] }, status: :unprocessable_entity
    else
      @user.save!
      render json: @user
    end
  end

  def remove_public_key
    @user = User.find(params[:user_id])
    authorize(@user, :update?)

    @user.rsa_public_key = nil
    @user.save!

    render json: @user
  end

  def request_developer_access
    @user = User.find(params.require(:user_id))
    authorize(@user, :update?)

    if @user[:is_developer]
      render json: { errors: [ "User is already a developer" ] }, status: :unprocessable_entity
      return
    end

    if @user.request_developer_access
      render json: @user, status: :ok
    else
      render json: { errors: @user.errors }, status: :unprocessable_entity
    end
  end

  def organizations
    return if admin_signed_in? && !masquerading? # this page doesn't make any sense for admins

    json_type =
      if params[:flat_json]
        Organization.flat_json
      else
        Organization::FULL_JSON
      end

    @organization = current_user.organizations.first
    respond_to do |format|
      format.html # list view
      format.json { render json: current_user.organizations.as_json(json_type) }
    end
  end

  def check_two_factor_code
    return if admin_signed_in? # this page doesn't make any sense for admins

    if current_user.authenticate_otp(params[:code])
      render json: { success: true }
    else
      render json: { success: false }
    end
  end

  def two_factor_secret_uri
    return if admin_signed_in? # this page doesn't make any sense for admins
    current_user.maybe_set_otp
    render json: { uri: current_user.provisioning_uri(current_user.email, issuer: "Transcriptic") }
  end

  def update_profile_img
    user   = User.find(params.require(:id))
    upload = Upload.find(params.require(:upload_id))

    authorize(user, :show?)
    authorize(upload, :show?)

    if user.profile_img_s3_bucket && user.profile_img_s3_key
      # Delete the object
      DeleteS3ItemJob.perform_async(user.profile_img_s3_bucket, user.profile_img_s3_key)
    end

    dst_bucket = "static-public.transcriptic.com"

    # Currently all upload objects will have a key like so.
    # uploads/c9addb7a-053c-4b38-9f81-9c2a650b78d5/profile_pic.jpg
    _, dst_base_key, dst_name = upload.key.split('/')

    new_bucket, new_key = S3Helper.instance.safe_copy(upload.bucket,
                                             upload.key,
                                             dst_bucket,
                                             "profile_pics/#{dst_base_key}",
                                             dst_name)

    user.profile_img_s3_bucket = new_bucket
    user.profile_img_s3_key    = new_key

    if user.save
      render json: user
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  def token
    return head :unauthorized unless user_signed_in?

    user_context = ACCESS_CONTROL_SERVICE.user_acl(current_user, @organization)
    # use CGI.parse to handle multiple filter of the same name
    filters = CGI.parse(URI.parse(request.original_url).query || "")

    # extract filters (support duplicate of params name and array naming (use by Rails tests))
    filter_lab = filters['filter[labId]'] + filters['filter[labId][]']
    filter_org = filters['filter[org]'] + filters['filter[org][]']
    filter_feature = (filters['filter[feature]'] + filters['filter[feature][]']).to_set

    # keep labs part of the filter
    filtered_lab_ctx_permissions = user_context['lab_ctx_permissions']&.select do |ctx|
      filter_lab.empty? || filter_lab.any? { |labId| labId == ctx['labId'] }
    end

    # keep org permission unless filtered out
    keep_org = filter_org.empty? || !filter_org.include?('false')
    filtered_org_ctx_permissions = keep_org  ? user_context['org_ctx_permissions'] : []

    # only keep the feature part of the filter
    unless filter_feature.empty?
      filtered_org_ctx_permissions = filtered_org_ctx_permissions&.select { |feature| filter_feature.include?(feature) }
      filtered_lab_ctx_permissions = filtered_lab_ctx_permissions&.flat_map do |ctx|
        new_features = ctx['features'].select { |feature| filter_feature.include?(feature) }
        if new_features.empty?
          []
        else
          [
            {
             'labId' => ctx['labId'],
             'features' => new_features
            }
          ]
        end
      end
    end

    filtered_user_context = {
      'org_ctx_permissions' => filtered_org_ctx_permissions || [],
      'lab_ctx_permissions' => filtered_lab_ctx_permissions || []
    }

    payload = {
      "sub" => current_user.id,
      "orgId" => @organization.id,
      "permissions" => filtered_user_context.select { |_, v| !v.empty? }
    }

    token = JWT_TOKEN_SERVICE.sign(payload)
    render json: { access_token: token }
  rescue => e
    Rails.logger.error "Could not create a token #{e.message}"
    errors = {
      errors: [
        {
          title: 'Internal Server Error',
          details: e.message,
          source: 'api/users/token',
          status: 500
        }
      ]
    }
    render json: errors, status: :internal_server_error
  end
end
