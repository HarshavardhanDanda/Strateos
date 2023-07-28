class SamplesController < UserBaseController
  before_action :authenticate_admin!, only: [ :move ]

  # GET /:organization_id/inventory/samples(.:format)
  # GET /:organization_id/samples(.:format)
  def index
    attrs = params.permit(:show_anonymous, :show_containers, :show_aliquots, :q, :per_page, :page).to_h

    filters = {
      organization_id: @organization.id,
      or: [],
      status: { not: [ 'pending_destroy', 'destroyed' ] },
      deleted_at: nil
    }
    if attrs[:show_anonymous] != 'true'
      filters[:or] << [ { name: { not: nil }}, { label: { not: nil }} ]
    end
    indices = []
    if attrs[:show_containers] != 'false'
      indices << Container.searchkick_index.name
    end
    if attrs[:show_aliquots] != 'false'
      indices << Aliquot.searchkick_index.name
    end

    q = attrs[:q].try(:strip).blank? ? '*' : attrs[:q]

    order =
      if q == '*'
        { created_at: :desc }
      else
        { _score: :desc }
      end

    request = Container.search(
      q,
      fields: [
        { 'label^20' => :word_middle },
        { 'name^20' => :word_middle },
        { 'resource_name^15' => :word_middle },
        '_all'
      ],
      index_name: indices,
      where: filters,
      per_page: (attrs[:per_page] or 10),
      page: (attrs[:page] or 1),
      order: order
    )
    render json: {
      results: request.results.map do |res|
        case res
        when Container
          res.as_json(Container.short_json)
        when Aliquot
          res.as_json(Aliquot.short_json)
        else
          res.as_json
        end
      end,
      num_pages: request.num_pages,
      per_page: request.per_page
    }
  end

  # GET /:organization_id/inventory/samples/find_aliquots_by_name(.:format)
  def find_aliquots_by_name
    # Find aliquots by name using case-insensitve match
    # Partial names will not match.
    names = params.require(:names).map(&:downcase).to_set

    if names.empty?
      return render json: { errors: [ "Must specify at least one name" ] }, status: :bad_request
    end

    aliquots = Aliquot.joins(:container)
                      .where(containers: { organization_id: @organization.id })
                      .where("lower(name) IN (?)", names)
                      .order(created_at: :DESC)

    found_names   = aliquots.map(&:name).map(&:downcase).to_set
    missing_names = names - found_names

    unless missing_names.empty?
      return render json: { errors: [ "Couldn't find #{missing_names.to_a}" ] }, status: :not_found
    end

    render json: aliquots.as_json(Aliquot.short_json)
  end

  # GET /:organization_id/inventory/samples/:id(.:format)
  # GET /:organization_id/samples/:id(.:format)
  def show
    @container = Container.with_deleted.find(params.require(:id))
    authorize(@container, :show?)

    render json: @container.as_json(Container.full_json)
  end

  # GET /:organization_id/inventory/samples/:id/:well_idx(.:format)
  # GET /:organization_id/samples/:id/:well_idx(.:format)
  def show_well
    container = @organization.containers.with_deleted.find(params.require(:id))
    authorize(container, :show?)

    well_idx = container.container_type.robot_well(params.require(:well_idx))
    aliquot = container.aliquots.find_by_well_idx(well_idx)
    render json: aliquot.as_json(Aliquot.full_json)
  end

  # GET /:organization_id/inventory/samples/:id/:well_idx/history(.:format)
  def aliquot_history
    container = @organization.containers.with_deleted.find(params.require(:id))
    authorize(container, :show?)

    well_idx        = container.container_type.robot_well(params.require(:well_idx))
    aliquot         = container.aliquots.order('created_at desc').find_by_well_idx(well_idx)
    aliquot_effects = aliquot.aliquot_effects.includes(generating_instruction: :run)

    render json: aliquot_effects.as_json(AliquotEffect.full_json)
  end

  # POST /:organization_id/inventory/samples(.:format)
  def create
    # TODO[jeremy]: update the UI to send container_type_id instead of this hack
    params[:container][:container_type_id] = params[:container][:container_type] if params[:container]

    attrs = params.require(:container).permit(
      :label,
      :test_mode,
      :container_type_id
    )

    @container = @organization.containers.build(attrs)
    @container.device_id = 'supply'

    authorize(@container, :create?)

    if @container.save
      render json: @container.as_json(Container.full_json), status: :created
    else
      render json: @container.errors, status: :unprocessable_entity
    end
  end

  # POST /:organization_id/inventory/samples/create_with_aliquots(.:format)
  def create_with_aliquots
    containers_params = params.require(:containers)
    ActiveRecord::Base.transaction do
      containers = bulk_create_with_aliquots(containers_params)
      link_compounds_to_container(containers, containers_params)
      render json: containers.as_json(Container.aliquots_json)
    end
  end

  # POST /:organization_id/inventory/samples/create_with_shipment(.:format)
  def create_with_shipment
    authorize(Container.new(organization: @organization), :create?)
    authorize(Shipment.new(organization: @organization), :create?)

    containers_params = params.require(:containers)
    containers = []
    ActiveRecord::Base.transaction do
      containers = bulk_create_with_aliquots(containers_params)
      shipment       = Shipment.create(organization: @organization, user_id: current_user.try(:id),
lab_id: containers_params.first[:lab_id])
      code_count     = containers_params.size
      shipment_codes = Shipment.generate_uniq_shipment_codes(code_count)

      containers.each_with_index.map do |container, index|
        container.update!({ shipment_id: shipment.id, shipment_code: shipment_codes[index],
created_by: shipment.user_id })
      end

      link_compounds_to_container(containers, containers_params)

      json = {
        containers: containers.as_json(Container.aliquots_json),
        shipment: shipment.as_json(Shipment::SHORT_JSON)
      }

      render json: json, status: :created
    end
  end

  # GET /:organization_id/shipments/:id/containers(.:format)
  def shipment_containers
    shipment = Shipment.find params.require(:id)
    authorize(shipment, :show?)

    render json: shipment.containers.as_json(Container.short_json)
  end

  # PATCH /:organization_id/inventory/samples/:id(.:format)
  # PUT   /:organization_id/inventory/samples/:id(.:format)
  def update
    @container = Container.with_deleted.find(params.require(:id))
    authorize(@container, :update?)

    attrs = params.require(:container).permit(:label)

    if @container.update(attrs)
      render json: @container
    else
      render json: @container.errors, status: :unprocessable_entity
    end
  end

  # PUT /:organization_id/inventory/samples/:id/:well_idx(.:format)
  def update_well
    @aliquot = Aliquot.with_deleted.find_by(
      container_id: params.require(:id),
      well_idx: params.require(:well_idx)
    )
    authorize(@aliquot, :update?)

    attrs = params.require(:aliquot).permit(
      :name,
      :resource,
      :resource_id,
      :volume_ul,
      :mass_mg,
      { :add_properties => [ [ :key, :value ] ] },
      { :delete_properties => [] }
    )

    if @aliquot.update(attrs)
      render json: @aliquot.as_json(Aliquot.mini_json)
    else
      render json: @aliquot.errors, status: :unprocessable_entity
    end
  end

  # GET /:organization_id/inventory/samples/:id/aliquots(.:format)
  def aliquots
    container = Container.find(params.require(:id))
    authorize(container, :show?)
    json_type =
      if params[:json_type] == 'mini_json'
        Aliquot.mini_json
      else
        Aliquot.flat_json
      end

    render json: container.aliquots.as_json(json_type)
  end

  # POST /:organization_id/inventory/samples/:id/create_aliquot(.:format)
  def create_aliquot
    container = @organization.containers.with_deleted.find(params.require(:id))
    aliquot_params = aliquot_create_params(params).except(:compound)
    aliquot   = container.aliquots.build(aliquot_params)

    authorize(aliquot, :create?)

    if aliquot_create_params(params)[:compound].present?
      compound_link = create_compound(aliquot_create_params(params)[:compound])
      aliquot.set_composition(compound_link)
    end

    if aliquot.save
      render json: aliquot.as_json(Aliquot.full_json), status: :created
    else
      render json: aliquot.errors, status: :unprocessable_entity
    end
  end

  # POST /:organization_id/inventory/samples/:id/create_aliquots(.:format)
  def create_aliquots
    # Safe because validated below in aliquot_create_params
    aliquots  = params[:aliquots]
    container = @organization.containers.with_deleted.find(params.require(:id))

    validated_aliquots = []
    validated_aliquot_ids = []

    # use activerecord-import because this can be a large number of wells
    # This bypasses before/after save callbacks so validate and add snowflake manually
    aliquots.each do |aliquot|
      attrs                = aliquot_create_params(aliquot).except(:compound)
      attrs[:container_id] = container.id

      if not attrs
        render json: badAliquot.errors, status: :unprocessable_entity
      else
        aliquot_params = aliquot_create_params(aliquot)
        new_aliquot    = Aliquot.new(attrs)
        if aliquot_params[:compound].present?
          compound_link = create_compound(aliquot_params[:compound])
          new_aliquot.set_composition(compound_link)
        end
        new_aliquot.id = Aliquot.generate_snowflake_id
        validated_aliquot_ids << new_aliquot.id
        validated_aliquots << new_aliquot
      end
    end

    validated_aliquots.each(&:run_bulk_import_callbacks)
    Aliquot.import(validated_aliquots)
    validated_aliquots.each(&:reindex)
    container.reindex

    render json: container.as_json(Container.full_json), status: :created
  end

  # DELETE /:organization_id/inventory/samples/:id(.:format)
  def destroy
    container = Container.find(params.require(:id))
    authorize(container, :destroy?)

    requester = current_user

    Searchkick.callbacks(:inline) do
      if (error = container.request_destroy(requester))
        return render json: { error_message: error }, status: :bad_request
      end
    end

    render json: container.as_json(Container.full_json)
  end

  # POST /:organization_id/inventory/samples/:id/undo_destroy(.:format)
  def undo_destroy
    begin
      container = Container.find(params.require(:id))
    rescue ActiveRecord::RecordNotFound
      return render json: { error_message: "Container destruction has already been processed." }, status: :gone
    end

    authorize(container, :destroy?)

    if (error = container.undo_destroy())
      return render json: { error_message: error }, status: :bad_request
    end

    render json: container.as_json(Container.full_json)
  end

  # Hard delete of all aliquots in container
  #
  # POST /:organization_id/inventory/samples/:id/destroy_aliquots(.:format)
  def destroy_aliquots
    @container = @organization.containers.find(params.require(:id))
    authorize(@container, :destroy?)

    # actually delete aliquots
    ids = @container.aliquots.pluck(:id)
    Rails.logger.info("Destroying aliquots from container #{@container.id} ids: #{ids}")
    Aliquot.delete(ids)

    if @container.save
      head :ok
    else
      render json: @container.errors, status: :unprocessable_entity
    end
  end

  private

  def bulk_create_with_aliquots(containers_params)
    default_lab = @organization.lab_consumers.first
    attr_tuples = containers_params.map do |cparams|
      # Convert container params into [container_attrs, aliquots_attrs] which
      # container must be in the form as follows:
      #   {barcode: '', label: '', ..., aliquots: {well_idx: {...}, ...}}
      cparams.require(:container_type)
      cparams[:status] = "inbound"

      container_attrs = cparams.permit(:container_type, :cover, :status, :label, :storage_condition, :test_mode,
:empty_mass_mg, :lab_id)

      if container_attrs[:lab_id].nil?
        container_attrs[:lab_id] = default_lab.lab_id
      end

      container_attrs = container_attrs.to_h

      # need to add container_type after creating the hash
      container_attrs[:container_type] = ContainerType.find_by_shortname(cparams.require(:container_type))
      container_attrs[:created_by] = current_user&.id

      # more ungodlyness.
      aliquots_attrs = cparams.fetch(:aliquots, {})
      aliquots_attrs = aliquots_attrs.transform_values { |v|
 v.slice(:name, :resource_id, :volume_ul, :properties, :mass_mg) }
      aliquots_attrs = aliquots_attrs.to_unsafe_h

      [ container_attrs, aliquots_attrs ]
    end

    attr_tuples.map do |(container_attrs, aliquots_attrs)|
      Container.create_with_wells_unsafe(container_attrs, aliquots_attrs, @organization)
    end
  end

  def aliquot_create_params(params)
    attrs = params.require(:aliquot)
                  .permit(:container_id, :well_idx, :name, :volume_ul, :mass_mg)
                  .to_h

    attrs[:properties] = params[:aliquot][:properties] || {}
    attrs[:compound] = params[:aliquot][:compound] || {}

    attrs
  end

  def link_compounds_to_container(containers, containers_params)
    containers.each_with_index do |container, index|
      compound_link_ids = containers_params[index][:compound_ids]

      next unless compound_link_ids.present?
        compound_links = CompoundServiceFacade::GetCompoundsByIds.call(compound_link_ids)
        container.set_compound_links(compound_links)
    end
  end

  def create_compound(compound)
    data = {
      attributes: {
        compound: {
          smiles: compound[:smiles]
        }
      }
    }

    if compound[:is_private]
      compound_link = CompoundLink.new(organization_id: @organization.id)
      authorize(compound_link, :create?)
      data[:attributes][:organization_id] = @organization.id
    else
      authorize(:compound_link, :create_public?)
    end

    created_compound_link = CompoundServiceFacade::CreateCompounds.call([ data ])
    if created_compound_link[:created].empty?
      raise InvalidOperation, "Compound registration failed : #{created_compound_link[:errored].first}"
    else
      created_compound_link[:created]
    end
  end
end
