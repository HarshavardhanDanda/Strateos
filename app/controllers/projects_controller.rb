class ProjectsController < UserBaseController

  def index
    allowed_fields = {
      'name' => { mult: 20, search_type: :word_middle },
      'id' => { mult: 1, search_type: :word },
      'run_ids' => { mult: 1, search_type: :word_middle }
    }
    authorize(Project.new, :index?)
    scope = Pundit.policy_scope!(pundit_user, Project)

    query             = params[:query].try(:strip).blank? ? '*' : params[:query]
    search_fields     = params[:search_fields] || allowed_fields.keys
    per_page          = (params[:per_page] || 10).to_i
    page              = (params[:page] || 1).to_i
    offset            = (page - 1) * per_page
    is_starred        = params[:is_starred] == 'false' ? false : params[:is_starred]
    sort_direction    = params[:created_at] || :desc
    organization_id   = params[:customer_organization_id]
    is_implementation = params[:is_implementation]

    where_clause = {}
    where_clause[:archived_at]     = nil if query == '*'
    where_clause[:organization_id] = organization_id if organization_id.present?

    if !is_implementation.nil?
      where_clause[:is_hidden] = is_implementation
    end

    # Experiment: we hypothesize that hitting elasticsearch is sometimes
    # slow in prod, so this is a fast-path to skip elasticsearch in the
    # common case of 'no search query'.
    if query == '*' && is_starred == false
      all_results = scope
                    .where(**where_clause)
                    .order(created_at: sort_direction)
                    .includes(:organization, :runs)
                    .offset(offset)

      results = all_results.limit(per_page).as_json(Project.short_json)
      total   = all_results.count

      return render json: {
        results: results,
        num_pages: (total / per_page.to_f).ceil,
        per_page: per_page,
        total: total
      }
    end

    bad_fields = search_fields - allowed_fields.keys
    unless bad_fields.empty?
      return render json: { errors: [ "Invalid search fields: #{bad_fields}" ] }, status: :bad_request
    end

    if current_user && is_starred == 'true'
      where_clause[:favorite_of] = current_user.id
    end

    order =
      if query == '*'
        { created_at: sort_direction }
      else
        [ { created_at: sort_direction }, { _score: :desc } ]
      end

    exact_match = query.starts_with?("\"") && query.ends_with?("\"")

    scope_ids = scope&.pluck(:id)

    if exact_match
      fields = search_fields
      query = query[1..query.length - 2]&.downcase

      filter = where_clause.map do |key, value|
        if value.is_a? Array
          { terms: { key => value }}
        else
          { term: { key => value }}
        end
      end

      request = SearchkickUtil::ExactMatchSearchHelper.search(query, page, per_page,
                                                              filter, order, fields, Project, scope_ids: scope_ids)
    else
      fields = search_fields.map do |name|
        info        = allowed_fields[name]
        mult        = info[:mult]
        search_type = info[:search_type]

        { "#{name}^#{mult}" => search_type }
      end

      where_clause[:id] = scope_ids
      request = Project.search(
        query,
        fields: fields,
        where: where_clause,
        per_page: per_page,
        page: page,
        order: order,
        body_options: { min_score: 1 }
      )
    end

    results = request.results.as_json(Project.short_json)

    render json: {
      results: results,
      num_pages: request.num_pages,
      per_page: request.per_page,
      total: request.response['hits']['total']
    }
  end

  def show
    @project = Project.find(params.require(:id))
    authorize(@project, :show?)

    render json: @project.as_json(Project.base_json)
  end

  def create
    create_params, errors = project_create_params
    return render json: { errors: errors }, status: :bad_request if errors.present?

    @project = Project.new(create_params)
    @project.organization_id = @organization.id unless @project.is_hidden
    @project.visibility    ||= "organization"
    @project.creating_user   = current_user

    if @project.is_hidden && !Organization.exists?(@project.organization_id)
      @project.errors.add(:organization_id, :not_found, id: @project.organization_id)
      return render json: @project.errors, status: :bad_request
    end

    authorize(@project, :create?)

    if @project.save
      render json: @project.as_json(Project.base_json),
             status: :created,
             location: organization_project_path(@organization.subdomain, @project.id)
    else
      render json: @project.errors, status: :bad_request
    end
  end

  def update
    @project = Project.find(params.require(:id))
    authorize(@project, :update?)

    # we pass an empty string from client for default payment method id
    # but postgres wants it stored as nil
    altered_params = project_update_params
    implementation_project_params = altered_params.extract!(:is_implementation)

    if !implementation_project_params[:is_implementation].nil?
      if @project.is_hidden && !implementation_project_params[:is_implementation]
        if !@project.runs.where(status: [ 'accepted', 'in_progress', 'pending' ]).empty?
          @project.errors.add(:is_implementation, :invalid_run_status)
          return render json: @project.errors, status: :bad_request
        else
          altered_params[:is_implementation] = false
        end
      elsif !@project.is_hidden && implementation_project_params[:is_implementation]
        @project.errors.add(:is_implementation, :already_visible)
        return render json: @project.errors, status: :bad_request
      end
    end

    if project_update_params[:payment_method_id] == ''
      altered_params[:payment_method_id] = nil
    end

    if altered_params.include?(:archived)
      @project.archived_at = altered_params[:archived] ? Time.now : nil
      altered_params.delete(:archived)
    end

    if @project.update(altered_params)
      render json: @project.as_json(Project.flat_json)
    else
      render json: @project.errors, status: :unprocessable_entity
    end
  end

  def transfer
    project             = Project.find(params.require(:id))
    organization_id     = params.require(:project).require(:organization_id)
    transfer_containers = params[:transfer_containers]

    authorize(project, :transfer?)

    if project.organization_id != organization_id
      organization = Organization.find_by_id(organization_id)
      if organization.nil?
        project.errors[:organization] << "Can not find organization #{organization_id}"
      else
        ActiveRecord::Base.transaction do
          project.transfer(organization)
          if transfer_containers
            container_ids = Run.joins(:refs)
                               .where(project_id: project.id)
                               .pluck('refs.container_id')
            containers = Container.with_deleted.where(id: container_ids)
            containers.each do |container|
              container.transfer(organization)
            end
          end
        rescue StandardError => e
          project.errors.add(:base, e)
          raise ActiveRecord::Rollback
        end
      end
    end
    if project.errors.empty?
      render json: project
    else
      render json: project.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @project = Project.find(params.require(:id))
    organization = @project.organization

    authorize(@project, :destroy?)

    if organization.projects.count == 1
      return render json: { message: "Can't destroy the only project" }, status: :unprocessable_entity
    end

    if @project.destroy
      head :ok
    else
      render json: @project.errors, status: :unprocessable_entity
    end
  end

  def archive
    @project = @organization.projects.find(params.require(:id))

    authorize(@project, :archive?)

    @project.archived_at = project_update_params[:archived] ? Time.now : nil

    if @project.save
      render json: @project
    else
      render json: @project.errors, status: :unprocessable_entity
    end
  end

  private

  def project_create_params
    project_params = params.require(:project)
    project_params.require(:name)

    permitted = project_params.permit(:name, :payment_method_id, :webhook_url, :bsl,
                                      :is_implementation, :organization_id)

    if permitted[:is_implementation] && !permitted[:organization_id].present?
      raise ActionController::ParameterMissing.new 'organization_id'
    end

    [ permitted, nil ]
  rescue ActionController::ParameterMissing => e
    return [ nil, [ e ] ]
  end

  def project_update_params
    params.require(:project)
          .permit(:name, :payment_method_id, :webhook_url, :archived, :bsl, :is_implementation)
  end
end
