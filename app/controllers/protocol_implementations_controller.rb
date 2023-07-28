class ProtocolImplementationsController < UserBaseController
  before_action :find_context

  def create
    safe_params = protocol_implementation_params.to_h
    attrs       = safe_params.merge(user: current_user, organization: @organization)

    protocol_implementation = ProtocolImplementation.new(attrs)

    InternalMailer.implementation_request(protocol_implementation).deliver
    head :ok
  end

  def protocol_implementation_params
    params.require(:assay)
    params.require(:details)
    params.permit(:assay, :details)
  end
end
