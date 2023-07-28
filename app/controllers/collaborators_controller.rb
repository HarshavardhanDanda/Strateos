class CollaboratorsController < UserBaseController

  def index
    json_type =
      if params[:flat_json]
        Collaborator.flat_json
      else
        Collaborator.full_json
      end

    @collaborators =
      if params[:user_id]
        user = User.find(params[:user_id])
        user.organization_collaborations
      elsif params[:org_id]
        organization = Organization.find(params[:org_id])
        authorize(organization, :show?)
        organization.collaborators
      elsif params[:subdomain]
        organization = Organization.find_by_subdomain(params[:subdomain])
        authorize(organization, :show?)
        organization.collaborators
      else
        authorize(@organization, :show?)
        @organization.collaborators
      end

    @collaborators = @collaborators.by_email(params[:email]) if params[:email]

    render json: @collaborators.as_json(json_type)
  end

  def create
    if params[:org_id]
      authorize(current_user, :can_manage_orgs_global?)
    else
      current_admin || authorize(current_user, :can_mange_org?)
    end
    organization = params[:org_id] ? Organization.find(params[:org_id]) : @organization
    collaborator = params.require(:collaborator)
    email        = collaborator.require(:email).downcase
    user         = User.find_by_email(email)
    created_user = false

    if user.nil?
      name = collaborator.permit(:name)[:name]

      first_name, last_name =
        if name.present?
          name.split(' ', 2)
        else
          [ 'User', nil ]
        end

      user = User.invite!({
                            email: email,
                            first_name: first_name,
                            last_name: last_name
                          }, current_user) do |u|
        u.skip_invitation = true # We'll send it after we add the collaborator record
      end

      if !user.errors.empty?
        return render json: user.errors, status: :unprocessable_entity
      end

      created_user = true
    else
      user.save
    end

    # create persmission in acs
    feature_group_id = create_permission_params.require(:featureGroupId)
    feature_groups = ACCESS_CONTROL_SERVICE.feature_groups(pundit_user.user, organization)
    feature_group = JSON.parse(feature_groups)['content'].find do |fg|
      fg['id'] == feature_group_id
    end

    if !feature_group
      return render json: [ 'Invalid request' ], status: :bad_request
    end

    is_lab_context = feature_group['context'] == 'LAB'
    context_id = organization.id

    if is_lab_context
      lab_id = create_permission_params.require(:labId)
      operated_lab = Lab.find_by_operated_by_id_and_id(organization.id, lab_id)
      if operated_lab.nil?
        return render json: [ 'Invalid request' ], status: :bad_request
      end

      context_id = lab_id
    end

    data = {}
    data[:featureGroupId] = feature_group['id']
    data[:contextId] = context_id
    data[:userId] = user.id

    ACCESS_CONTROL_SERVICE.create_permission(pundit_user.user, organization, data)

    @collaborator = organization.collaborators.with_deleted.find_or_create_by(
      collaborating: user,
      collaborative: organization
    )

    unless @collaborator.errors.empty?
      return render json: @collaborator.errors, status: :bad_request
    end

    @collaborator.update(deleted_at: nil)

    if created_user
      user.deliver_invitation
      audit_trail_log(user, organization)
    else
      UserMailer.collaboration(current_user, user, organization).deliver_later
    end

    render json: @collaborator.as_json(Collaborator.full_json), status: :created
  end

  def destroy
    if params[:org_id]
      authorize(current_user, :can_manage_orgs_global?)
    else
      current_admin || authorize(current_user, :can_mange_org?)
    end

    organization = params[:org_id] ? Organization.find(params[:org_id]) : @organization
    collaborating_id = params.require(:collaborating_id)

    if collaborating_id == organization.owner_id
      raise Pundit::NotAuthorizedError
    end

    @collaborator = Collaborator.find_by(collaborating_id: collaborating_id,
      collaborative_type: 'Organization', collaborative_id: organization.id)
    data = {}
    data[:permissionId] = params.require(:permission_id)
    data[:userId] = collaborating_id
    ACCESS_CONTROL_SERVICE.remove_permission(pundit_user.user, organization, data)
    data = {}
    data[:userIds] = [ @collaborator.collaborating.id ]
    existing_permissions = JSON.parse(ACCESS_CONTROL_SERVICE.permission_summary(pundit_user.user, organization, data))
    collaborating_user = User.find(collaborating_id)
    is_platform_admin = has_platform_features_in_org?(user: collaborating_user,
      organization: organization)
    if existing_permissions.empty? && !is_platform_admin
      @collaborator.destroy
      if !organization.nil? and collaborating_id
        NOTIFICATION_SERVICE.delete_user_subscription(collaborating_id,organization.id)
      end
    end
    head :ok
  end

  private

  def create_permission_params
    params.require(:permission).permit(:labId, :featureGroupId)
  end

  def audit_trail_log(user, org)
    resource_data_param = { :id => user.id, :name => "User", :type => user.class.name }
    description = "An invitation has been sent to user with id: #{user.id} and email: #{user.email} to join "\
                  "the organization (#{org.id}) as a collaborator on the Strateos platform"
    event_type = AuditTrail::EventType::CREATE
    AuditTrail::APIAuditDataStore.add_audit_message(event_type, resource_data_param, description)
  end
end
