class ContainersDownloadService
  include Callable

  def initialize(container_ids, visible_columns, request_path)
    @container_ids = container_ids
    @visible_columns = visible_columns
    @request_path = request_path
  end

  def call
    download_containers(@container_ids, @visible_columns, @request_path)
  end

  private

  def download_containers(container_ids, visible_columns, source)
    csv_file_name_mappings, result_success, result_errors = generate_csv_files(container_ids, visible_columns,
                                                                               source)
    zip = generate_zip(csv_file_name_mappings, 'csv') unless csv_file_name_mappings.empty?

    unless zip.nil?
      attachments = [ BulkRequest.create_attachment("container_results.zip", zip.to_s) ]
    end
    return {
      attachments: attachments || [],
      result_success: result_success,
      result_errors: result_errors
    }
  end

  def generate_csv_files(container_ids, visible_columns, source)
    mandatory_headers = [ 'aliquot_name', 'container_label', 'container_id', 'container_type', 'aliquot_id',
                          'well', 'human_well', 'created_at', 'volume_remaining', 'concentration',
                          'compound_link_id', 'smiles', 'molecular_weight', 'reference_id', 'external_system_ids',
                          'barcode', 'organization_name', 'location' ]
    valid_visible_column_headers = [ 'status', 'contents', 'condition', 'last used', 'code', 'run', 'creator', 'lab',
                                     'empty', 'empty mass', 'hazards' ]
    filtered_visible_columns = visible_columns&.map(&:downcase) & valid_visible_column_headers
    result_success = []
    result_errors = []
    csv_headers_by_org = {}
    csv_rows_by_org = {}

    containers = Container.with_deleted.where(id: container_ids)

    idx_offset = 0
    (container_ids - containers.pluck(:id))
      .each_with_index do |invalid_container_id, idx|
      container_not_found_error = JSONAPI::Error.new(code: JSONAPI::RECORD_NOT_FOUND,
                                                     status: :not_found,
                                                     title: I18n.t('errors.messages.record_not_found_title'),
                                                     detail: 'Container does not exist',
                                                     source: "/#{idx}")
      formatted_response = BulkRequest.format_result(invalid_container_id,
                                                     "#{source}/#{idx}",
                                                     container_not_found_error)
      if formatted_response[:errors].present?
        result_errors << formatted_response
      else
        result_success << formatted_response
      end
      idx_offset += 1
    end

    container_ccpc_headers_by_org = collect_ccps(containers, :container)
    container_kvp_headers_by_org = collect_props(containers, :container)
    aliquot_ccpc_headers_by_org = collect_ccps(containers, :aliquot)
    aliquot_kvp_headers_by_org = collect_props(containers, :aliquot)

    containers
      .includes(
        { aliquots: [
          { compound_links: [ :compound_link_external_system_ids, :compound ] },
          :contextual_custom_properties,
          :contextual_custom_properties_configs,
          :container_type
        ] },
        :contextual_custom_properties,
        :contextual_custom_properties_configs,
        :container_type
      ).find_each.with_index(idx_offset) do |container, idx|

      organization_id = container.organization_id || 'stock'

      if csv_headers_by_org[organization_id].nil?
        csv_headers = mandatory_headers.dup
        csv_headers.concat(container_ccpc_headers_by_org[organization_id] || [])
        csv_headers.concat(container_kvp_headers_by_org[organization_id] || [])
        csv_headers.concat(aliquot_ccpc_headers_by_org[organization_id] || [])
        csv_headers.concat(aliquot_kvp_headers_by_org[organization_id] || [])
        csv_headers.concat(filtered_visible_columns)
        csv_headers_by_org[organization_id] = csv_headers
      end

      csv_rows_by_org[organization_id] = [] if csv_rows_by_org[organization_id].nil?

      jsonapi_error = nil
      if container.aliquots.empty?
        jsonapi_error = JSONAPI::Error.new(code: JSONAPI::RECORD_NOT_FOUND,
                                           status: :not_found,
                                           title: I18n.t('errors.messages.record_invalid_title'),
                                           detail: I18n.t('errors.attributes.container.has_no_aliquots'),
                                           source: "/#{idx}")
      else
        container.aliquots.each do |aliquot|
          csv_row = {}
          csv_row["aliquot_name"] = aliquot.name
          csv_row["container_label"] = aliquot.container.label
          csv_row["container_id"] = aliquot.container_id
          csv_row["container_type"] = aliquot.container.container_type.name
          csv_row["aliquot_id"] = aliquot.id
          csv_row["well"] = aliquot.well_idx
          csv_row["human_well"] = aliquot.container.container_type&.human_well(aliquot.well_idx)
          unless aliquot.container.created_at.nil?
            csv_row["created_at"] = aliquot.container.created_at.strftime('%a %b %e %Y %T %:z')
          end
          csv_row["volume_remaining"] = aliquot.volume_ul
          csv_row["barcode"] = aliquot.container.barcode
          csv_row["organization_name"] = aliquot.container.organization&.name
          csv_row["location"] = aliquot.container.location_id

          aliquot.aliquots_compound_links.each do |aliquot_compound_link|
            compound_link = aliquot_compound_link.compound_link
            compound = compound_link.compound
            csv_row["concentration"] = aliquot_compound_link.concentration
            csv_row["compound_link_id"] = compound_link.id
            csv_row["external_system_ids"] = compound_link.compound_link_external_system_ids
                                               &.select(organization_id: container.organization_id)
                                               &.pluck(:external_system_id)
            csv_row["reference_id"] = compound_link.reference_id
            csv_row["smiles"] = compound&.smiles
            csv_row["molecular_weight"] = compound&.molecular_weight
          end

          container_ccps = container.contextual_custom_properties
          container_ccps&.each do |property|
            container_ccp_config = property.contextual_custom_properties_config
            csv_row["ct_#{container_ccp_config.key}"] = get_ccp_value(property, container_ccp_config)
          end

          container_kvps = container.properties
          container_kvps&.each do |key, value|
            csv_row["ct_#{key}"] = value
          end

          aliquot_ccps = aliquot.contextual_custom_properties
          aliquot_ccps&.each do |property|
            aliquot_ccp_config = property.contextual_custom_properties_config
            csv_row["aq_#{aliquot_ccp_config.key}"] = get_ccp_value(property, aliquot_ccp_config)
          end

          aliquot_kvps = aliquot.properties
          aliquot_kvps&.each do |key, value|
            csv_row["aq_#{key}"] = value
          end

          populate_visible_columns(container, csv_row, visible_columns)

          csv_rows_by_org[organization_id] << csv_row
        end
      end

      formatted_response = BulkRequest.format_result(container, "#{source}/#{idx}", jsonapi_error)
      if formatted_response[:errors].present?
        result_errors << formatted_response
      else
        result_success << formatted_response
      end
    end

    csv_file_name_mappings = {}
    csv_rows_by_org.map do |org_id, rows|
      next if rows.empty?

      csv_org_file_name = Organization.find_by_id(org_id)&.name || 'stock'
      csv_file = CSV.generate do |csv|
        csv << csv_headers_by_org[org_id]
        rows&.each do |row|
          csv << generate_csv_row_from_values(row, csv_headers_by_org[org_id])
        end
      end
      csv_file_name_mappings[csv_org_file_name] = csv_file
    end
    return [ csv_file_name_mappings, result_success, result_errors ]
  end

  def generate_zip(file_name_mappings, file_extension)
    zip = Zip::Archive.open_buffer(Zip::CREATE) do |zipfile|
      file_name_mappings.each do |file_name, file|
        if file && file != ""
          zipfile.add_buffer("#{file_name}_container_results.#{file_extension}", file)
        end
      end
    end

    zip
  end

  def generate_csv_row_from_values(row, org_headers)
    csv_row = []
    org_headers.each do |header|
      csv_row << row[header] || ''
    end
    csv_row
  end

  def collect_ccps(containers, context_type)
    ccpcs = ContextualCustomPropertiesConfig
            .where(organization_id: containers.pluck(:organization_id))
    prop_prefix = context_type == :aliquot ? "aq" : "ct"
    merge_prop_keys_to_array = lambda { |acc, (org, key)|
      acc[org] = [ *acc[org], "#{prop_prefix}_#{key}" ]
      acc
    }
    ccpcs.where(context_type: context_type.to_s.capitalize)
         .pluck(:organization_id, :key)
         .reduce({}, &merge_prop_keys_to_array)
         .transform_values(&:sort!)
  end

  def collect_props(containers, context_type)
    prop_prefix = context_type == :aliquot ? "aq" : "ct"
    merge_prop_keys_to_array = lambda { |acc, (org, key)|
      acc[org] = [ *acc[org], "#{prop_prefix}_#{key}" ]
      acc
    }
    org_path = context_type == :aliquot ? 'containers.organization_id' : 'organization_id'
    props_path = context_type == :aliquot ? 'aliquots.properties' : 'properties'
    containers = containers.joins(:aliquots) if context_type == :aliquot
    containers
      .group("#{org_path}, json_object_keys(#{props_path})::text")
      .pluck("#{org_path}, json_object_keys(#{props_path})::text")
      .reduce({}, &merge_prop_keys_to_array)
      .transform_keys { |k| k || 'stock' }
      .transform_values(&:sort!)
  end

  def get_ccp_value(ccp, ccp_config)
    config_type = ccp_config&.config_definition["type"]
    config_options = ccp_config&.config_definition["options"]

    if config_type === 'choice'
      ccp_option = config_options.select { |option| option["value"] === ccp.value }.first
      return ccp_option["name"]
    elsif config_type === 'multi-choice'
      selected_option_values = ccp.value.split(";")
      selected_option_names = config_options.select { |option|
        selected_option_values.include?(option["value"])
      }.pluck("name").join(";")
      return selected_option_names
    else
      return ccp.value
    end
  end

  def populate_visible_columns(container, row, visible_columns)
    visible_columns.each do |column|
      case column.downcase
      when 'status'
        row["status"] = container.status
      when 'contents'
        row["contents"] = "#{container.aliquot_count} aliquots"
      when 'condition'
        row["condition"] = container.storage_condition
      when 'last used'
        row["last_used"] = container.updated_at
      when 'code'
        row["shipment_code"] = container.shipment_code
      when 'run'
        row["generated_by_run_id"] = container.generated_by_run_id
      when 'creator'
        user = User.find_by_id(container.created_by)
        row["created_by"] = user&.name || user&.email
      when 'lab'
        row["lab"] = container.lab&.name
      when 'empty', 'empty mass'
        row["empty_mass_mg"] = container.empty_mass_mg
      when 'hazards'
        row["hazards"] = container.hazards
      else
        next
      end
    end
  end
end
