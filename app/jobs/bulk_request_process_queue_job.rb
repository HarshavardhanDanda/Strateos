class BulkRequestProcessQueueJob < ActiveJob::Base
  queue_as :bulk_requests

  PER_PAGE = 100

  def perform(bulk_request_id)
    bulk_request = BulkRequest.find(bulk_request_id)

    source = "/api/bulk_requests/#{bulk_request_id}"
    error = nil
    response = nil
    # convert to switch case when more context types are added
    begin
      response = if bulk_request.context_type == BulkRequest::CONTAINER
                   perform_container_actions(bulk_request, source)
                 end
    rescue Pundit::NotAuthorizedError => pundit_error
      error = JSONAPI::Error.new(code: JSONAPI::FORBIDDEN, status: :unauthorized,
                                 title: I18n.t('errors.messages.not_authorized_title'),
                                 detail: pundit_error.message, source: source)
    rescue JSONAPI::Exceptions::Error => json_api_exception
      error = json_api_exception.errors[0]
      error.source = source
    rescue ActionController::BadRequest => action_controller_error
      error = JSONAPI::Error.new(code: JSONAPI::VALIDATION_ERROR, status: :bad_request,
                                 title: I18n.t('errors.messages.bad_request'),
                                 detail: action_controller_error, source: source)
    rescue => exception
      error = JSONAPI::Error.new(code: JSONAPI::INTERNAL_SERVER_ERROR, status: :internal_server_error,
                                 title: I18n.t('errors.messages.internal_server_error'),
                                 detail: exception.message, source: source)
    end

    bulk_request.failed_with_errors = error unless error.nil?
    unless response.nil?
      bulk_request.add_result_errors response[:result_errors] if response[:result_errors].present?
      bulk_request.add_result_success response[:result_success] if response[:result_success].present?
      bulk_request.add_attachments response[:attachments] if response[:attachments].present?
    end
    bulk_request.completed_at = Time.now
    bulk_request.save!
    Rails.logger
         .info("Bulk request #{bulk_request.context_type} #{bulk_request.bulk_action} #{bulk_request_id} completed")
  end

  private

  def perform_container_actions(bulk_request, source)
    search_query = bulk_request.search_query.deep_symbolize_keys
    additional_data = bulk_request.additional_data.deep_symbolize_keys
    user_context = pundit_user(bulk_request)
    container_ids = BulkRequest.search_query_results(search_query,
                                                     bulk_request.expected_records,
                                                     PER_PAGE,
                                                     user_context)
    if container_ids.empty?
      raise StandardError.new(I18n.t(
        'activerecord.errors.models.bulk_request.attributes.search_query.nil_container_results'))
    end

    case bulk_request.bulk_action
    when BulkRequest::ACTION_RELOCATE
      location_id = additional_data[:location_id]
      return ContainersRelocateService.call(container_ids, location_id, user_context, source)
    when BulkRequest::ACTION_DELETE
      return ContainerDeleteService.call(container_ids, user_context, source)
    when BulkRequest::ACTION_DESTROY
      return ContainersDestroyService.call(container_ids, user_context, source)
    when BulkRequest::ACTION_TRANSFER
      organization_id = additional_data[:organization_id]
      return ContainersTransferService.call(container_ids, organization_id, source)
    when BulkRequest::ACTION_DOWNLOAD
      visible_columns = additional_data[:visible_columns]
      return ContainersDownloadService.call(container_ids, visible_columns, source)
    else
      nil
    end
  end

  def pundit_user(bulk_request)
    user         = bulk_request.created_by
    organization = bulk_request.organization
    permissions  = ACCESS_CONTROL_SERVICE.user_acl(user, organization)
    UserContext.new(user, organization, permissions)
  end
end
