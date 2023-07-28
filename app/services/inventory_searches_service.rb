class InventorySearchesService
  include Callable

  def initialize(attrs, user_context)
    @attrs = attrs
    @user_context = user_context
  end

  def call
    inventory_search(@attrs, @user_context)
  end

  def self.similar_compounds_with_score(compound, org_id, threshold = nil)
    compound_links = CompoundServiceFacade::SearchCompounds.call(
      compound,
      threshold: threshold,
      org_ids: [ org_id ],
      include_public: true
    )

    search_scores = {}
    compound_ids = []
    compound_links.each do |cl|
      search_scores[cl[:compound_link_id]] = cl[:score]
      compound_ids.push(cl[:compound])
    end
    [ compound_ids.uniq, search_scores ]
  end

  def self.aliquot_compound_scores(search_result, search_scores)
    response = []
    common_compounds = search_result[:compound_link_ids] & search_scores.keys
    common_compounds.each do |c_id|
      aliquots = CompoundServiceFacade::GetCompound
                 .call(c_id, CompoundServiceFacade::Scope::PUNDIT_SCOPE)
                 .aliquots.where(container_id: search_result[:id])
      aliquots.each do |aliquot|
        aliquot_compound_score = {}
        aliquot_compound_score[:aliquot_id] = aliquot[:id]
        aliquot_compound_score[:compound_id] = c_id
        aliquot_compound_score[:search_score] = search_scores[c_id]
        response.append(aliquot_compound_score)
      end
    end
    # response is in the desc order of similarity_search_scores
    response.sort_by { |r| r[:search_score] }.reverse
  end

  private

  def inventory_search(attrs, user_context)
    application_policy = ApplicationPolicy.new(user_context, nil)

    allowed_fields = {
      'label'               => { mult: 2, search_type: :word_middle },
      'aliquot_names'       => { mult: 1, search_type: :word_middle },
      'compound_link_ids'   => { mult: 1, search_type: :word },
      'id'                  => { mult: 1, search_type: :word_start },
      'barcode'             => { mult: 1, search_type: :word_start },
      'shipment_id'         => { mult: 1, search_type: :word_start },
      'generated_by_run_id' => { mult: 1, search_type: :word_start },
      'organization_name'   => { mult: 1, search_type: :word_start },
      'batch_ids'           => { mult: 1, search_type: :word }
    }

    # find containers by label or aliquot name
    query                        = attrs[:query].try(:strip).blank? ? '*' : attrs[:query]
    sort_by                      = attrs[:sort_by] || 'updated_at'
    sort_order                   = attrs[:sort_desc] ? :desc : :asc
    search_fields                = attrs[:search_fields] || allowed_fields.keys
    storage_condition            = attrs[:storage_condition]
    status                       = attrs[:status]
    volume                       = attrs[:volume]
    shipped                      = attrs[:shipped]
    empty_mass                   = attrs[:empty_mass]
    generated                    = attrs[:generated]
    materials                    = attrs[:materials]
    hide_containers_with_pending_runs = attrs[:hide_containers_with_pending_runs] || false
    includes                          = attrs[:include] || []
    ignore_score                      = attrs[:ignore_score] || false
    compound                          = attrs[:compound]
    container_type                    = attrs[:container_type]
    search_hazard                     = attrs[:search_hazard]
    created_by                        = attrs[:created_by]
    per_page                          = attrs[:per_page]
    page                              = attrs[:page]
    compound_link_id                  = attrs[:compound_link_id]
    lab_id                            = attrs[:lab_id]
    compound_count                    = attrs[:compound_count]
    mass                              = attrs[:mass]
    test_mode                         = attrs[:test_mode]
    organization_id                   = attrs[:organization_id]
    barcode                           = attrs[:barcode]
    batch_ids                         = attrs[:batch_ids] || []
    created_after                     = attrs[:created_after]
    created_before                    = attrs[:created_before]
    locations                         = attrs[:locations]
    locations_deep                    = attrs[:locations_deep]
    show_containers_without_runs      = attrs[:show_containers_without_runs] || false
    bulk_search_params                = attrs[:bulk_search] || []
    label                             = attrs[:label]
    ids                               = attrs[:ids]
    contextual_custom_properties      = attrs[:contextual_custom_properties]
    aliquot_ccps                      = attrs[:aliquot_contextual_custom_properties]
    container_properties              = attrs[:container_properties]
    aliquot_properties                = attrs[:aliquot_properties]
    wildcard_aliquot_ccp              = attrs[:wildcard_aliquot_ccp]
    # aliquot_count will be set to 1 by UI in Aliquot Selection mode
    aliquot_count = attrs[:aliquot_count] || 0

    allowed_includes = [ 'container_type', 'aliquots', 'aliquots.compounds', 'aliquots.resource&.compound',
                         'contextual_custom_properties' ]
    bad_includes     = includes.select { |inc| !allowed_includes.include?(inc) }

    if !bad_includes.empty?
      raise JSONAPI::Exceptions::InvalidFieldValue.new(:include, bad_includes)
    end

    valid_sort_by_names = [
      'is_tube',
      'created_at',
      'updated_at',
      'label',
      'storage_condition',
      'container_type_id',
      'location_id',
      'organization_name',
      'created_by',
      'lab_id',
      'barcode'
    ]

    if not valid_sort_by_names.include? sort_by
      raise JSONAPI::Exceptions::InvalidFieldValue.new(:sort_by, sort_by)
    end

    exact_match = query.starts_with?("\"") && query.ends_with?("\"")
    if exact_match
      query          = query[1..query.length - 2]
      allowed_fields = allowed_fields.slice('label', 'id', 'barcode', 'batch_ids')
      search_fields  = attrs[:search_fields] || allowed_fields.keys
    end

    bad_fields = search_fields - allowed_fields.keys
    if !bad_fields.empty?
      raise JSONAPI::Exceptions::InvalidFieldValue.new(:search_fields, bad_fields)
    end

    where = {
      aliquot_count: { gte: aliquot_count },
      deleted_at:    nil
    }

    aliquot_count_filter = {
      range: {
        aliquot_count: {
          from:          aliquot_count,
          include_lower: true
        }
      }
    }

    filter = []
    filter.push(aliquot_count_filter)

    # we are adding scope here inorder to fetch lab/org context records specific to current user
    if user_context.user && !add_scope(where, user_context, application_policy)
      raise Pundit::NotAuthorizedError.new I18n.t('errors.messages.not_authorized')
    end

    search_by_score = {
      _score: "desc"
    }

    sort_by_field          = {}
    sort_by_field[sort_by] = sort_order

    sort = [
      search_by_score,
      sort_by_field
    ]

    unless bulk_search_params.empty?
      bulk_search_scope = get_bulk_search_scope(bulk_search_params)
      if bulk_search_scope[:error].present?
        raise JSONAPI::Exceptions::InvalidFieldValue.new(:bulk_search,
                                                         bulk_search_scope[:error])
      end

      filter.concat(bulk_search_scope[:filter])
      where.merge!(bulk_search_scope[:where])
    end

    additional_filters = [
      SearchkickUtil::NestedFieldUtil
        .build_nested_queries(wildcard_aliquot_ccp, "aliquot_contextual_custom_properties"),
      SearchkickUtil::NestedFieldUtil
        .build_nested_queries(container_properties, "properties"),
      SearchkickUtil::NestedFieldUtil
        .build_nested_queries(contextual_custom_properties, "contextual_custom_properties"),
      SearchkickUtil::NestedFieldUtil
        .build_nested_queries(aliquot_ccps, "aliquot_contextual_custom_properties"),
      SearchkickUtil::NestedFieldUtil
        .build_nested_queries(aliquot_properties, "aliquot_properties")
    ].flatten.compact
    filter.push(*additional_filters)

    # Show test_mode containers if params explicitly passes test_mode
    # or if status is 'test' or 'all'
    if !test_mode.nil?
      where[:test_mode] = test_mode
      filter.push({ term: { test_mode: test_mode }}) if status != 'all_except_deleted'
    end

    search_scores = {}
    if compound
      if compound[:exact_match] == 'false'
        compound_ids, search_scores = InventorySearchesService.similar_compounds_with_score(
          { compound[:notation].downcase.to_sym => compound[:value] },
          user_context.organization.id,
          compound[:similarity_threshold].present? ? compound[:similarity_threshold] : nil
        )
        where[:compound_ids] = compound_ids
      else
        identifier = [ { value: compound[:value], notation: compound[:notation] } ]
        where[:compound_link_ids] = CompoundServiceFacade::GetCompounds
                                    .call(
                                      { with_identifiers: identifier },
                                      CompoundServiceFacade::Scope::PUBLIC_AND_PRIVATE
                                    ).map(&:id)
      end
    end

    compound_link_ids = []
    if compound_link_id.present?
      compound_link_ids.push(compound_link_id)
    end

    if search_hazard.present?
      compound_link_ids.concat(CompoundServiceFacade::GetCompounds
                          .call({ flags: search_hazard }, CompoundServiceFacade::Scope::PUNDIT_SCOPE).map(&:id))
    end

    compound_link_ids.uniq!
    if compound_link_ids.present?
      where[:compound_link_ids] = compound_link_ids
      filter.push({ terms: { compound_link_ids: compound_link_ids }})
    end

    if compound_count.present?
      where[:compound_count] = compound_count
      filter.push({ term: { compound_count: compound_count }})
    end

    lab_ids = []
    if user_context.user && application_policy.has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
      lab_ids = application_policy.lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
    end

    if lab_id.present?
      where[:lab_id] = lab_id
      lab_id.is_a?(Array) ? lab_ids.concat(lab_id) : lab_ids.push(lab_id)
    end

    if lab_ids.present?
      filter.push({ terms: { lab_id: lab_ids.uniq }})
    end

    if batch_ids.present?
      where[:batch_ids] = batch_ids
    end

    if locations.present? || locations_deep.present?
      locations_to_search = []
      if locations.present?
        locations_to_search.concat(locations)
      end
      if locations_deep.present?
        locations_to_search.concat(locations_deep)
        locations_deep.to_set.each do |location|
          children_locations = Location.find(location).descendants.pluck(:id)
          locations_to_search.concat(children_locations)
        end
      end
      where[:location_id] = locations_to_search.uniq
      filter.push({ terms: { location_id: locations_to_search.uniq }})
    end

    organization_filter = nil
    if organization_id.present? && ((is_lab_consumer?(organization_id, application_policy) ||
      organization_id == user_context.organization.id) ||
      !Organization.exists?(organization_id))
      where[:organization_id] = organization_id
      organization_filter     = {
        term: {
          organization_id: organization_id
        }
      }
    end

    if user_context.user && !application_policy.has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
      organization_filter = {
        term: {
          organization_id: user_context.organization.id
        }
      }
    end

    filter.push(organization_filter) if organization_filter.present?

    if empty_mass.present? && (empty_mass['min'].present? || empty_mass['max'].present?)
      empty_mass_ranges        = {}
      empty_mass_ranges_filter = {
        range: {
          empty_mass_mg: {
            from:          nil,
            include_lower: true,
            to:            nil,
            include_upper: true
          }
        }
      }
      if empty_mass['min'].present?
        empty_mass_ranges[:gte]                                 = empty_mass['min']
        empty_mass_ranges_filter[:range][:empty_mass_mg][:from] = empty_mass['min']
      end
      if empty_mass['max'].present?
        empty_mass_ranges[:lte]                               = empty_mass['max']
        empty_mass_ranges_filter[:range][:empty_mass_mg][:to] = empty_mass['max']
      end
      where[:empty_mass_mg] = empty_mass_ranges
      filter.push(empty_mass_ranges_filter)
    end

    if volume
      where[:aliquot_volumes] = {}
      if volume['gt']
        where[:aliquot_volumes][:gt] = volume['gt']
      end
      if volume['lt']
        where[:aliquot_volumes][:lt] = volume['lt']
      end

      if volume['gt'] || volume['lt']
        aliquot_volumes_ranges_filter = {
          range: {
            aliquot_volumes: {
              from:          volume && volume['gt'] ? volume['gt'] : nil,
              include_lower: false,
              to:            volume && volume['lt'] ? volume['lt'] : nil,
              include_upper: false
            }
          }
        }
        filter.push(aliquot_volumes_ranges_filter)
      end

      if volume['gte']
        where[:aliquot_volumes][:gte] = volume['gte']
        aliquot_volume_filter         = {
          range: {
            aliquot_volumes: {
              from:          volume && volume['gte'] ? volume['gte'] : nil,
              include_lower: true
            }
          }
        }
        filter.push(aliquot_volume_filter)
      end
    end

    if attrs[:hide_tubes] || attrs[:hide_plates]
      where['is_tube'] = attrs[:hide_tubes] ? false : true
      filter.push({ term: { is_tube: attrs[:hide_tubes] ? false : true }})
    end

    if storage_condition.present?
      where['storage_condition'] = storage_condition
      filter.push({ term: { storage_condition: storage_condition }})
    end

    if shipped || generated
      origin_filter = {
        bool: {
          must_not: {
            bool: {
              must_not: {
                exists: {
                  field: shipped ? 'shipment_id' : 'generated_by_run_id'
                }
              }
            }
          }
        }
      }
      where[:shipment_id]         = { not: nil } if shipped
      where[:generated_by_run_id] = { not: nil } if generated
      filter.push(origin_filter)
    end

    if materials
      where[:orderable_material_component_id] = { not: nil }
    end

    if hide_containers_with_pending_runs
      run_ids                     = Run.where(status: 'pending').pluck('id')
      where[:generated_by_run_id] = { not: run_ids }
      generated_by_run_id_filter = {
        bool: {
          must_not: {
            terms: {
              generated_by_run_id: run_ids
            }
          }
        }
      }
      filter.push(generated_by_run_id_filter)
    end

    if container_type.present?
      where['container_type'] = container_type
      filter.push({ terms: { container_type: container_type }})
    end

    if barcode.present?
      where['barcode'] = barcode
      filter.push({ terms: { barcode: Array(barcode) }})
    end

    if label.present?
      where['label'] = label
      filter.push({ terms: { label: Array(label) }})
    end

    if ids.present?
      where['id'] = ids
      filter.push({ terms: { id: Array(ids) }})
    end

    if show_containers_without_runs
      where[:run_count] = 0
      filter.push({ term: { run_count: { value: 0 }}})
    end

    if created_by.present?
      where['created_by'] = created_by
      filter.push({ term: { created_by: created_by }})
    end

    if created_after.present? || created_before.present?
      date_created_range_filter = {
        range: {
          created_at: {
            from:          created_after || nil,
            include_lower: true,
            to:            created_before || nil,
            include_upper: true
          }
        }
      }
      if created_after.present? && created_before.present?
        where[:created_at]       = {}
        where[:created_at][:gte] = created_after
        where[:created_at][:lte] = created_before
        filter.push(date_created_range_filter)
      elsif created_after.present?
        where[:created_at]       = {}
        where[:created_at][:gte] = created_after
        filter.push(date_created_range_filter)
      elsif created_before.present?
        where[:created_at]       = {}
        where[:created_at][:lte] = created_before
        filter.push(date_created_range_filter)
      end
    end

    if mass.present?
      where[:aliquot_masses]       = {}
      where[:aliquot_masses][:gte] = mass['gte']

      aliquot_mass_filter = {
        range: {
          aliquot_masses: {
            from:          mass && mass['gte'] ? mass['gte'] : nil,
            include_lower: true
          }
        }
      }
      filter.push(aliquot_mass_filter)
    end

    case status
    when 'available'
      where[:status] = [ 'inbound', 'available' ]
    when 'will_be_returned'
      where[:status] = [ 'pending_return' ]
    when 'returned'
      where[:status] = [ 'returned' ]
    when 'consumable'
      where[:status]     = [ 'consumable' ]
      where[:deleted_at] = {}
    when 'will_be_destroyed'
      where[:will_be_destroyed] = true
    when 'destroyed'
      where[:status] = [ 'pending_destroy', 'destroyed' ]
      # Equivalent to all ('*'). Searchkick where clause does not have a
      # wildcard option for subcategories.
      where[:deleted_at] = {}
    when 'test'
      where[:test_mode] = true
    when 'all'
      where[:status]     = {}
      where[:deleted_at] = {}
    when 'all_except_deleted'
      # remove test mode restriction
      where.delete(:test_mode)
      where[:status]       = {}
      where[:status][:not] = [ 'destroyed' ]
    else
      where[:status] = {}
    end

    if status != 'consumable' && status != 'destroyed' && status != 'all'
      delete_must_not_exist_filter = {
        bool: {
          must_not: {
            exists: {
              field: "deleted_at"
            }
          }
        }
      }
      filter.push(delete_must_not_exist_filter)
    end

    status_not_destroyed_filter = {
      bool: {
        must_not: {
          terms: {
            status: [
              "destroyed"
            ]
          }
        }
      }
    }

    if status == 'all_except_deleted'
      filter.push(status_not_destroyed_filter)
    elsif status != 'all' && status != 'will_be_destroyed'
      filter.push({ terms: { status: where[:status] }}) if where[:status].present?
    end

    if status == 'will_be_destroyed'
      filter.push({ term: { will_be_destroyed: true }})
    end

    order =
      if ignore_score
        # ignoring the score is useful in fields that were mapped from aliquots
        # for example a container might have 100 aliquots with the same name and another only 1.
        # The two containers would have different scores, and then would lead to bad sorting by other fields.
        [ { sort_by => sort_order } ]
      else
        [ { sort_by => sort_order }, { "_score" => :desc } ]
      end

    fields = search_fields.map do |name|
      info        = allowed_fields[name]
      mult        = info[:mult]
      search_type = info[:search_type]

      { "#{name}^#{mult}" => search_type }
    end

    if exact_match
      fields = search_fields
      if compound_link_id.present?
        fields = [ 'label' ]
      end
      request = SearchkickUtil::ExactMatchSearchHelper.search(query, page, per_page, filter, sort, fields,
                                                              Container)
    else
      request = SearchkickUtil::ComplexQuerySearchHelper.search(
        Container,
        query,
        fields:           fields,
        order:            order,
        per_page:         per_page,
        page:             page,
        where:            where,
        load_from_db:     false,
        additional_filters: additional_filters
      )
    end

    [ request, search_scores ]
  end

  def add_scope(where, user_context, application_policy)
    permission_checks = []
    lab_ids           = application_policy.lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
    permission_checks.push('lab_id': lab_ids) if lab_ids.present?
    if application_policy.has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
      permission_checks.push('organization_id': user_context.organization.id)
    end
    if application_policy.has_feature_in_org(VIEW_SAMPLE_CONTAINERS) || lab_ids.present?
      return where[:_or] = permission_checks
    end
  end

  def is_lab_consumer?(org_id, application_policy)
    orgs = []
    application_policy.lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)&.each do |labId|
      orgs.concat(Lab.find(labId).organizations.map(&:id))
    end
    orgs.uniq.include? org_id
  end

  def get_bulk_search_scope(bulk_search_params)
    allowed_bulk_search_fields = [ 'barcode', 'label', 'id' ].freeze
    bulk_search_fields         = []
    ids                        = []
    bulk_search_params.each do |bulk_search|
      ids.concat(bulk_search[:container_ids])
      bulk_search_fields.push(bulk_search[:field])
    end

    bad_bulk_search_fields = bulk_search_fields.select { |f| !allowed_bulk_search_fields.include?(f) }
    unless bad_bulk_search_fields.empty?
      return { error: bad_bulk_search_fields }
    end

    ids.uniq!

    {
      bulk_search_fields: bulk_search_fields,
      where:              { id: ids },
      filter:             [ { terms: { id: ids }} ]
    }
  end
end
