class CreditsController < UserBaseController
  respond_to :json

  def index
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      @organization
                    end
    render json: organization.credits
  end

end
