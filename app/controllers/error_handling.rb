module ErrorHandling
  def self.included(base)
    if Feature.enabled? :catch_errors
      base.rescue_from Exception,                    with: :render_500
      base.rescue_from ActiveRecord::RecordNotFound, with: :render_404_record_not_found
      base.rescue_from Feature::Disabled,            with: :render_404
    end

    base.rescue_from ActionController::UnknownFormat,    with: :render_406
    base.rescue_from Pundit::NotAuthorizedError,         with: :render_pundit_403
    base.rescue_from PaymentRequiredException,           with: :render_402
    base.rescue_from ActionController::BadRequest,       with: :render_400
    base.rescue_from ActionController::ParameterMissing, with: :render_400
    base.rescue_from ActiveRecord::RecordInvalid,        with: :render_400
    base.rescue_from ActiveRecord::RecordNotUnique,      with: :render_400
    base.rescue_from StateMachine::InvalidTransition,    with: :render_500
    base.rescue_from WalterServiceError,                 with: :render_400
    base.rescue_from NetSuite::NetSuiteRequestError,     with: :render_netsuite_error
    base.rescue_from NetSuite::NetSuiteAccessError,      with: :render_401
  end

  def render_netsuite_error(error)
    render json: { message: error.message }, status: :unprocessable_entity
  end

  def render_401(error)
    respond_to do |format|
      format.html { render 'errors/401', :status => 401, :layout => "error" }
      format.json { render json: { message: error.message }, status: :unauthorized }
      format.all { head :unauthorized }
    end
  end

  def render_400(exception)
    @error_message = exception.message
    respond_to do |format|
      format.html { render 'errors/400', :status => 400, :layout => "error" }
      format.json { render json: { message: exception.message }, status: :bad_request }
      format.all { head :bad_request }
    end
  end

  def render_402(message = 'Payment method required')
    render json: { message: message }, status: :payment_required
  end

  def render_pundit_403(e)
    id       = e.record.try(:id)
    resource = e.policy.class.to_s.gsub('Policy', '')
    method   = e.query.to_s.delete('?')

    error_message = "NotAuthorized to #{method} #{resource}"
    error_message << ": #{id}" if id

    Rails.logger.error error_message
    render json: { error_message: "NotAuthorized" }, status: :forbidden
  end

  def render_404(_exception)
    respond_to do |format|
      format.html { render 'errors/404', :status => 404, :layout => "error" }
      format.all { head :not_found }
    end
  end

  def render_404_record_not_found(exception)
    # TODO: In rails 5 we can pull out id, model, and primary_key
    Rails.logger.info("RecordNotFound: #{exception.message}")
    render_404(exception)
  end

  def render_406(_exception)
    head :not_acceptable
  end

  def render_500(exception)
    @incident_id = "ex1#{SNOWFLAKE.next.to_base31}"
    Bugsnag.notify(exception, {
      incident_id: @incident_id,
      severity: 'error'
    }) if Rails.env.production?

    respond_to do |format|
      format.html { render 'errors/500', :status => 500, :layout => "error" }
      format.json { render json: { errors: exception }, :status => 500 }
      format.all { head :internal_server_error }
    end
  end

  def render_503(exception)
    # Notify bugsnag in a background thread because on large payloads (as of
    # bugsnag 2.8.4), bugsnag can take a really long time (30sec+) to cleanup
    # the metadata it's going to send, resulting in the request being killed by the worker
    # and generating a "Service Unavailable" HTML result.
    Thread.new { Bugsnag.notify(exception, severity: :warning) }
    message = "There was an unknown problem with your request.  Please contact
               support@transcriptic.com.  If you can include the content of the
               request that caused this, please do.".squish
    render json: { message: message }, status: :service_unavailable
  end
end
