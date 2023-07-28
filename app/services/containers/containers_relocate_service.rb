class ContainersRelocateService
  include Callable

  def initialize(container_ids, location_id, user_context, source = nil)
    @container_ids = container_ids
    @location_id = location_id
    @user_context = user_context
    @source = source
  end

  def call
    relocate_containers(@container_ids, @location_id, @user_context, @source)
  end

  private

  def relocate_containers(container_ids, location_id, user_context, source)
    results = { :result_success => [], :result_errors => [] }
    plate_containers_count = Container.joins(:container_type)
                                      .where(id: container_ids, container_types: { is_tube: false }).count
    location_ids = []
    location_errors = nil
    # If there are no plate containers in selected containers
    # then it is confirmed that all selected containers are tubes
    if plate_containers_count.equal?(0)
      location_ids, location_errors = LocationService.next_available_locations(
        location_id,
        container_ids.count
      )
    end
    if !location_errors.nil?
      raise ActionController::BadRequest, location_errors
    end

    ActiveRecord::Base.transaction do
      container_ids.each_with_index do |container_id, index|
        container = Container.find(container_id)
        if ContainerPolicy.new(user_context, container).move?
          if plate_containers_count.equal?(0)
            container, errors = LocationService.move(container_id, location_ids[index])
          else
            container, errors = LocationService.move(container_id, location_id)
          end

          if errors.empty?
            success_response = BulkRequest.format_result(container)
            results[:result_success].push(success_response)
          else
            errors.each_value do |value|
              container.errors.add(:base, value)
            end
            results[:result_errors].push(BulkRequest.format_result(container,
                                                                   "#{source}/#{index}"))
          end
        else
          raise Pundit::NotAuthorizedError, I18n.t("errors.messages.not_authorized")
        end
      rescue ActiveRecord::RecordNotFound => e
        record_not_found_response_builder(e, index, container_id, results, source)
      rescue Pundit::NotAuthorizedError
        unauthorized_response_builder(index, container, results, source)
      end
    end
    return results
  end

  def unauthorized_response_builder(index, container, results, source)
    jsonapi_error = JSONAPI::Error.new(code: JSONAPI::FORBIDDEN,
                                       status: :unauthorized,
                                       title: I18n.t('errors.messages.not_authorized_title'),
                                       detail: I18n.t('errors.messages.not_authorized'),
                                       source: "#{source}/#{index}")
    results[:result_errors].push(BulkRequest.format_result(container,
                                                           "#{source}/#{index}",
                                                           jsonapi_error))
  end

  def record_not_found_response_builder(error, index, container_id, results, source)
    jsonapi_error = JSONAPI::Error.new(code: JSONAPI::RECORD_NOT_FOUND,
                                       status: :not_found,
                                       title: I18n.t('errors.messages.record_not_found_title'),
                                       detail: error.message,
                                       source: "#{source}/#{index}")
    results[:result_errors].push(BulkRequest.format_result(container_id,
                                                           "#{source}/#{index}",
                                                           jsonapi_error))
  end
end
