class LaunchRequestsController < UserBaseController

  def show
    scope = Pundit.policy_scope!(pundit_user, LaunchRequest)
    request = scope.find(params[:request_id])
    render json: request.as_json(LaunchRequest.full_json)
  end

  def create
    protocol = Protocol.find(params.require(:id))
    authorize(protocol, :show?)
    launch_params = launch_request_params
    org_from_launch_params = launch_params[:organization_id]
    lab = org_from_launch_params ? Organization.find(org_from_launch_params).labs.first : @organization.labs.first

    # HOTFIX - Commenting this out so admins can launch runs while masquerading
    # if admin_signed_in?
    #   return render json: {errors: ["Admins cannot launch runs"]}, status: :bad_request
    # end

    # We require :parameters here instead of permitting them in launch_request_params
    # because when you permit a hash you must specify all the keys of the hash.
    # We don't want to have to do that because the ManifestUtil is what validates input schema.
    raw_input = params.require(:launch_request).require(:parameters).to_unsafe_h

    req = LaunchRequest.new(
      organization_id: org_from_launch_params || @organization.id,
      raw_input:       raw_input,
      protocol_id:     protocol.id,
      test_mode:       launch_params[:test_mode] || false,
      bsl:             launch_params[:bsl] || 1,
      user:            current_user,
      lab:             lab
    )

    if req.save
      render json: req, status: :created
    else
      render json: req.errors, status: :unprocessable_entity
    end
  end

  private

  def launch_request_params
    params.require(:launch_request).require(:parameters)
    params.require(:launch_request).permit(:test_mode, :bsl, :organization_id)
  end
end
