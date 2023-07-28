class OrganizationsController < UserBaseController

  def show
    authorize(@organization, :show?)
    render json: @organization
  end

  def index
    json_type =
      if params[:flat_json]
        Organization.flat_json
      else
        Organization::FULL_JSON
      end

    render json: current_user.organizations.as_json(json_type)
  end

  def runs
    respond_to do |format|
      format.json { render json: @organization.runs }
    end
  end

  def new
    @organization = Organization.new
    authorize(@organization, :show?)

    respond_to do |format|
      format.html # new.html.erb
    end
  end

  def update
    organization = if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      current_admin || authorize(current_user, :can_mange_org?)
                      @organization
                    end
    update_params = organization_params
    if update_params[:profile_photo_upload_id]
      upload = Upload.find(update_params[:profile_photo_upload_id])
      authorize(upload, :show?)

      # extract aws key from upload
      update_params[:profile_photo_attachment_url] = upload.key

      # remove value as it is not an attribute
      update_params.delete(:profile_photo_upload_id)
    end

    if update_params[:two_factor_auth_enabled]
      if !current_user.two_factor_auth_enabled?
        return render json: { error: "Your user account must have two factor enabled "\
                                     "before you can enable it for your organization" },
status: :bad_request
      end
    end

    # Update User permissions for owner - Adding permissions for all possible feature groups
    owner_id = update_params[:owner_id]
    if owner_id.present? && organization.owner_id != owner_id
      feature_groups = JSON.parse(ACCESS_CONTROL_SERVICE.feature_groups(pundit_user.user, organization))
      labs = Lab.where(operated_by: organization)
      feature_groups['content'].each do |feature_group|
      if feature_group['context'] == 'LAB'
        labs.each do |lab|
          create_permission(feature_group['id'], lab.id, User.find(owner_id), organization)
        end
      else
        create_permission(feature_group['id'], organization.id, User.find(owner_id), organization)
      end
    end

      collaborator = Collaborator.find_by(collaborating_id: owner_id)
      collaborator.update(deleted_at: nil)
      audit_ownership_change(owner_id, organization)
    end
    if organization.update(update_params)
      render json: organization
    else
      render json: organization.errors, status: :bad_request
    end
  end

  def destroy
    authorize(@organization, :manage?)
    @organization.destroy
    head :ok
  end

  private

  def create_permission(feature_group_id, context_id, user, organization = @organization)
      data = {}
      data[:featureGroupId] = feature_group_id
      data[:contextId] = context_id
      data[:userId] = user.id
      ACCESS_CONTROL_SERVICE.create_permission(pundit_user.user, organization, data)
  end

  def organization_params
    if admin_signed_in?
      params.require(:organization).permit!
    else
      org_params = [
        :name,
        :subdomain,
        :kind,
        :plan,
        :run_approval,
        :profile_photo_attachment_url,
        :profile_photo_upload_id,
        :two_factor_auth_enabled,
        add_metadata_keys: [ :table, :key, :kind ],
        delete_metadata_keys: [ :table, :key ]
      ]
      org_params << :owner_id if (@organization.owner_id == current_user.id) ||
                                 has_platform_feature('TRANSFER_OWNERSHIP_GLOBAL')

      params.require(:organization).permit(*org_params)
    end
  end

  def audit_ownership_change(new_owner_id, org)
    new_owner = User.find(new_owner_id)
    resource_data_param = { :id => org.id, :name => "Organization", :type => org.class.name }
    description = "Ownership transferred to #{new_owner.email}"
    event_type = AuditTrail::EventType::UPDATE
    AuditTrail::APIAuditDataStore.add_audit_message(event_type, resource_data_param, description)
  end
end
