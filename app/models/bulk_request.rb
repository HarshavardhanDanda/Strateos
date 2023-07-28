class BulkRequest < ApplicationRecord
  has_snowflake_id('bk')
  acts_as_paranoid

  CONTAINER = 'container'
  ACTION_RELOCATE = 'relocate'
  ACTION_DESTROY = 'destroy'
  ACTION_DELETE = 'delete'
  ACTION_TRANSFER = 'transfer'
  ACTION_DOWNLOAD = 'download'
  CONTEXT_TYPES = [ CONTAINER ].freeze
  BULK_ACTIONS = {
    CONTAINER => [ ACTION_RELOCATE, ACTION_DELETE, ACTION_DESTROY, ACTION_TRANSFER, ACTION_DOWNLOAD ]
  }

  belongs_to :organization
  belongs_to :created_by, class_name: 'User', foreign_key: 'created_by'

  validates :context_type, presence: true, inclusion: {
    in: CONTEXT_TYPES,
    message: lambda do |_, data|
      I18n.t("activerecord.errors.models.bulk_request.attributes.context_type.invalid_context_type",
             :value => data[:value],
             :context_types => CONTEXT_TYPES)
    end
  }

  validates :bulk_action, presence: true
  validates :search_query, presence: true
  validates :organization, presence: true
  validates :created_by, presence: true
  validates :expected_records, presence: true, numericality: { greater_than: 0 }
  validate :validate_bulk_action, unless: -> { context_type.nil? || bulk_action.nil? }
  validate :validate_search_query, unless: -> { context_type.nil? || search_query.blank? }
  validate :validate_additional_data, unless: -> { context_type.nil? || bulk_action.nil? }

  INVENTORY_SEARCH_SCHEMA = JSON.parse(File.read(Rails.root.join('app/models/schemas/container_search_schema.json')))

  def add_result_errors(error_objects)
    return if error_objects.blank?

    result_errors.concat error_objects
    save!
  end

  def add_result_success(success_objects)
    return if success_objects.blank?

    result_success.concat success_objects
    save!
  end

  def add_attachments(items)
    return if items.blank?

    attachments.concat items
    save!
  end

  def validate_bulk_action
    if BULK_ACTIONS[context_type] && !BULK_ACTIONS[context_type].include?(bulk_action)
      errors.add(:bulk_action, :invalid_bulk_action,
                 value: bulk_action,
                 context_type: context_type,
                 actions: BULK_ACTIONS[context_type])
    end
  end

  def validate_search_query
    if context_type == CONTAINER
      begin
        JSON::Validator.validate!(INVENTORY_SEARCH_SCHEMA, search_query)
      rescue JSON::Schema::ValidationError => e
        errors.add :search_query, e.message
      end
    end
  end

  def validate_additional_data
    required_params = []
    if context_type == CONTAINER
      case bulk_action
      when ACTION_RELOCATE
        required_params << 'location_id'
      when ACTION_TRANSFER
        required_params << 'organization_id'
      else
        # unknown action, skip
      end
    end
    missing_params = required_params.filter { |key| additional_data[key].nil? }
    unless missing_params.empty?
      errors.add :additional_data, :missing_params, params: missing_params
    end
  end

  def self.search_query_results(query, expected_records, per_page, user_context)
    container_ids = []
    has_results = true
    attrs = query[:data][:attributes]
    attrs[:per_page] = per_page
    attrs[:page] = 1
    total_fetched = 0

    while has_results
      request, _search_score = InventorySearchesService.call(attrs, user_context)
      container_ids_list = request.results.map { |r| r[:id] }

      if (total_fetched + container_ids_list.size) <= expected_records
        container_ids.push(container_ids_list).flatten!
        total_fetched += container_ids_list.size
        attrs[:page] = attrs[:page] + 1
        has_results = false if ( total_fetched == expected_records || container_ids_list.size == 0)
      else
        remaining_container_ids = expected_records - total_fetched
        container_ids.push(container_ids_list.first(remaining_container_ids)).flatten!
        has_results = false
      end
    end
    container_ids
  end

  # @param entity [ActiveRecord] instance of ActiveRecord model which needs to be formatted
  # @param source [String, nil] source of the container getting processed for e.g index, request API path. Default nil
  # @param jsonapi_error [JSONAPI::Error, nil] json api error which can be directly passed to errors. Default nil
  def self.format_result(entity, source = nil, jsonapi_error = nil)
    case entity.class.to_s
    when 'Container'
      {
        id: entity.id,
        status: entity.status,
        updated_at: entity.updated_at,
        label: entity.label,
        organization_id: entity.organization_id,
        barcode: entity.barcode,
        location_id: entity.location_id,
        errors: if entity.errors || jsonapi_error
                  BulkRequest.format_errors(entity.errors.messages, source, jsonapi_error)
                else
                  nil
                end
      }
    when 'String'
      {
        id: entity,
        errors: BulkRequest.format_errors([], source, jsonapi_error)
      }
    end
  end

  def self.format_errors(errors, source, jsonapi_error = nil)
    return nil unless errors.present? || !jsonapi_error.nil?

    formatted_errors = []
    unless jsonapi_error.nil?
      formatted_errors << jsonapi_error
    end
    errors.each do |_, messages|
      messages.each do |message|
        error = JSONAPI::Error.new(code: JSONAPI::VALIDATION_ERROR, status: :unprocessable_entity,
                                   title: 'Record invalid', detail: message, source: source)
        formatted_errors << error
      end
    end
    formatted_errors
  end

  def self.create_attachment(file_name, content)
    { name: file_name, data: Base64.encode64(content) }
  end
end
