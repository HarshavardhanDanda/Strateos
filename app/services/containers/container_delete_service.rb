class ContainerDeleteService
  include Callable

  def initialize(container_ids, user_context, request_path)
    @container_ids = container_ids
    @user_context = user_context
    @request_path = request_path
  end

  def call
    delete_containers(@container_ids, @user_context, @request_path)
  end

  private

  def delete_containers(container_ids, user_context, request_path)
    result_success = []
    result_errors = []
    jsonapi_error = nil
    container_ids.each_with_index do |container_id, idx|
      begin
        container = Container.find(container_id)
        if ContainerPolicy.new(user_context, container).delete?
          container.confirm_destroy()
        else
          raise Pundit::NotAuthorizedError, I18n.t("errors.messages.not_authorized")
        end
      rescue ActiveRecord::RecordNotFound => e
        jsonapi_error = JSONAPI::Error.new(code: JSONAPI::RECORD_NOT_FOUND, status: :not_found,
                                           title: 'Record invalid',
                                           detail: "Container not found, may already be destroyed.",
                                           source: "#{request_path}/#{idx}")
      rescue Pundit::NotAuthorizedError => e
        jsonapi_error = JSONAPI::Error.new(code: JSONAPI::FORBIDDEN, status: :unauthorized,
                                           title: 'Record invalid', detail: e.message, source: "#{request_path}/#{idx}")
      end

      formatted_response = BulkRequest.format_result(container.nil? ? container_id : container,
                                                     "#{request_path}/#{idx}",
                                                     jsonapi_error)
      if formatted_response[:errors].present?
        result_errors << formatted_response
      else
        result_success << formatted_response
      end
    end
    return { result_success: result_success, result_errors: result_errors }
  end
end
