require 'uuid'

class ResourcesController < UserBaseController

  def index
    kind = params[:kind]
    storage_condition = params[:storage_condition]
    compound_id = params[:compound_id]
    sort_by = params[:sort_by] || 'updated_at'
    sort_order = params[:sort_desc] == 'true' ? :desc : :asc
    is_provisionable = params[:is_provisionable] || false;

    container_id = params.fetch(:container_id, nil)
    attrs = params.permit(:q, :per_page, :page).to_h

    organization_ids = [ @organization.id ]

    if !container_id.nil?
      container = Container.with_deleted.find(container_id)
      container && organization_ids.push( container.organization_id, container.lab&.operated_by_id)
    end

    if compound_id.present? && !UUID.validate(compound_id)
      return render json: { errors: [ "Improperly formatted uuid for compound_id" ] }, status: :bad_request
    end

    organization_ids = organization_ids.reject(&:blank?).uniq

    where = { organization_id: organization_ids }

    where['deleted_at'] = nil

    if kind.present?
      where['kind'] = kind
    end

    if storage_condition.present?
      where['storage_condition'] = storage_condition
    end

    if compound_id.present?
      where['compound_id'] = compound_id
    end

    if is_provisionable
      omcs = OrderableMaterialComponent.where(provisionable: true)
      resource_ids = []
      omcs.each do |omc|
        resource_ids.push(omc.material_component&.resource_id)
      end
      if !resource_ids.empty?
        where['id'] = resource_ids.uniq
      end
    end

    q = attrs[:q].blank? ? '*' : attrs[:q]
    request = Resource.search(
      q,
      fields: [ :name, :id ],
      match: :word_start,
      where: where,
      per_page: attrs[:per_page].try(:to_i) || 10,
      page: attrs[:page].try(:to_i) || 1,
      order: [ { sort_by => sort_order }, { "_score" => :desc } ]
    )
    render json: {
      results: request.results,
      num_pages: request.num_pages,
      per_page: request.per_page
    }
  end

  def autocomplete
    resources = Resource.search(
      params.require(:q),
      fields: [ { name: :word_start } ],
      where: { organization_id: @organization.id },
      order: { _score: :desc },
      limit: 10
    )

    json = resources.map { |r| { id: r.id, name: r.name } }

    render json: json
  end

  def show
    @resource = Resource.find(params.require(:id))

    authorize(@resource, :show?)

    render json: @resource.as_json(Resource.full_json).merge(
      aliquots: @resource.aliquots.joins(:container).where('containers.organization_id = ?', @organization.id)
    )
  end

  def show_many
    resources = Resource.find(params.require(:ids))
    resources.each { |resource| authorize(resource, :show?) }

    render json: resources.as_json(Resource.mini_json)
  end

  def create
    @resource = Resource.new(resource_params)
    @resource.organization_id = @organization.id

    authorize(@resource, :create?)

    if @resource.save
      render json: @resource.as_json(Resource.full_json), status: :created
    else
      render json: @resource.errors, status: :unprocessable_entity
    end
  end

  def update
    @resource = Resource.find(params.require(:id))

    authorize(@resource, :update?)

    if @resource.update(resource_params)
      render json: @resource.as_json(Resource.full_json), status: :ok
    else
      render json: @resource.errors, status: :unprocessable_entity
    end
  end

  def destroy
    resource = Resource.find(params.require(:id))
    authorize(resource, :destroy?)

    if resource.destroy
      render json: resource, status: :ok
    else
      render json: resource.errors, status: :unprocessable_entity
    end
  end

  private

  def resource_params
    params[:resource].permit(:name, :kind, :compound_id, :purity, :storage_condition, sensitivities: [])
  end
end
