module Api
  module V1
    module Actions
      class CollaboratorActionsController < UserBaseController
        def remove_user_collaborations
          org_ids = params[:org_ids]
          if !org_ids.kind_of?(Array)
            org_ids = org_ids.split(",")
          end

          collaborating_id = params.require(:collaborating_id)
          user = User.find(collaborating_id)
          organizations = Organization.find(org_ids)
          org_with_platform_feature = get_org_with_platform_feature(user, organizations)
          if org_with_platform_feature.present?
            raise(ActionController::BadRequest, "User #{user.id} has platform feature"\
              " in #{org_with_platform_feature.id}")
          end

          if org_ids.any?
            authorize(current_user, :can_remove_users_from_platform?)
            acs_payload = {
              orgIds: org_ids
            }
            ACCESS_CONTROL_SERVICE.remove_organization_permissions(pundit_user.user, @organization, acs_payload,
                                                                   collaborating_id)
          end

          orgs_with_empty_permissions = []
          organizations.each do |organization|
            collaborator = Collaborator.find_by(collaborating_id: collaborating_id,
                                                collaborative_type: 'Organization',
                                                collaborative_id: organization.id)
            permission_summary_payload = {
              userIds: [ collaborator.collaborating.id ]
            }
            existing_permissions = JSON.parse(ACCESS_CONTROL_SERVICE.permission_summary(user, organization,
                                                                                        permission_summary_payload))
            if existing_permissions.empty?
              Searchkick.callbacks(:inline) do
                collaborator.destroy
                orgs_with_empty_permissions.push(organization.id)
              end
            end
          end
          if !orgs_with_empty_permissions.blank? and collaborating_id
            NOTIFICATION_SERVICE.delete_user_subscription(collaborating_id, orgs_with_empty_permissions.join(','))
          end
          head :ok
        end

        private

        def get_org_with_platform_feature(user, organizations)
            organizations.find{ |organization| has_platform_features_in_org?(user: user,
              organization: organization) }
        end
      end
    end
  end
end
