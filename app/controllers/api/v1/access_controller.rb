module Api
  module V1
    class AccessController < UserBaseController
      def user_acl
        current_admin || authorize(@organization, :member?)

        response = ACCESS_CONTROL_SERVICE.user_acl(current_user || current_admin, @organization)
        render json: response, status: :ok
      end

      def feature_groups
        if params[:organization_id]
          authorize(current_user, :can_manage_orgs_global?)
        else
          current_admin || authorize(current_user, :can_mange_org?)
        end
        org = params[:organization_id].present? ? Organization.find(params[:organization_id]) : @organization
        response = ACCESS_CONTROL_SERVICE.feature_groups(current_user || current_admin, org)
        render json: response, status: :ok
      end

      def permission_summary
        if params[:orgId]
          authorize(current_user, :can_manage_orgs_global?)
          @organization = Organization.find(params[:orgId])
        else
          current_admin || authorize(@organization, :member?)
        end
        data = {}
        data[:contextIds] = params[:contextIds]
        data[:userIds] = params[:userIds]
        data[:featureCode] = params[:featureCode]
        if params[:contextIds].present? && (current_admin && @organization.nil?)
          @organization = Organization.find(params[:contextIds][0])
        end

        response = ACCESS_CONTROL_SERVICE.permission_summary(current_user || current_admin, @organization, data)
        render json: response, status: :ok
      end

      def permission_summary_by_org
        authorize(@organization, :member?)
        data = {}
        data[:userIds] = params[:userIds]
        data[:featureCode] = params[:featureCode]

        @organization = Organization.find(params.require(:organizationId))

        response = ACCESS_CONTROL_SERVICE.permission_summary(current_user || current_admin, @organization, data)
        render json: response, status: :ok
      end
    end
  end
end
