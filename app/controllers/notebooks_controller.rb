class NotebooksController < UserBaseController
  # The Jupyter server scopes the notebooks by user_id and not by project_id.
  # Since the project_id is not known at notebook creation time in the Jupyter server
  # we must query directly using notebook id.
  before_action :find_project_context, :except => [ :index, :show, :update ]

  def index
    @project = Project.find(params.require(:project_id)) if params[:project_id]

    # HACK
    # Temporarily support fetching notebooks by project or by user_id.
    notebooks =
      if @project
        authorize(@project, :show?)
        @project.notebooks
      else
        Notebook.where(user_id: current_user.id)
      end

    respond_to do |format|
      format.json do
        render json: notebooks.as_json
      end
      format.jupyter do
        render json:  {
          content: notebooks.as_json,
          created: @project.created_at,
          format: 'json',
          last_modified: @project.updated_at,
          mimetype: nil,
          name: '',
          path: '',
          type: 'directory',
          writable: true
        }
      end
    end
  end

  def show
    respond_to do |format|
      format.nbviewer do
        notebook = Notebook.find(params.require(:id))
        authorize(notebook, :show?)

        response = Excon.post(
          "#{KEROSENE_URL}/nbviewer",
          body: ActiveSupport::JSON.decode(notebook.content).to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

        render json: response.body
      end
      format.jupyter do
        path = Base64.decode64(params.require(:id))
        path = path[1..-1] if path[0] == '/'

        notebook = Notebook.find_by_path!(path)
        authorize(notebook, :show?)

        output = notebook.as_json
        output['content'] = ActiveSupport::JSON.decode(notebook.content)

        render json: output
      end
      format.json do
        notebook = Notebook.find(params.require(:id))
        authorize(notebook, :show?)

        output = notebook.as_json
        output['content'] = ActiveSupport::JSON.decode(notebook.content)

        render json: notebook
      end
    end
  end

  def fork
    # only allow users, non-admins, to fork.
    authenticate_user!

    nb = @project.notebooks.find(params.require(:id))

    authorize(nb, :show?)

    copy = nb.fork(current_user)
    if copy.save
      render json: copy
    else
      render json: copy.errors, status: :unprocessable_entity
    end
  end

  def create
    # only allow users, non-admins, to create notebooks.
    authenticate_user!

    notebook            = Notebook.new()
    notebook.name       = 'Untitled Notebook'
    notebook.project_id = @project.id
    notebook.user       = current_user

    content = notebook_params[:content]
    content[:cells] ||= []
    notebook.content = ActiveSupport::JSON.encode(content)

    if notebook.save
      render json: notebook.as_json
    else
      render json: notebook.errors, status: :unprocessable_entity
    end
  end

  def update
    respond_to do |format|
      format.jupyter do
        path     = Base64.decode64(params.require(:id))
        path     = path[1..-1] if path[0] == '/'

        notebook = Notebook.find_by_path!(path)
        authorize(notebook, :update?)

        new_params = notebook_params

        if new_params[:content]
          new_params[:content] = ActiveSupport::JSON.encode(new_params[:content])
        end

        notebook.update(new_params.to_unsafe_h)

        output = notebook.as_json

        output['content'] = ActiveSupport::JSON.decode(notebook.content)

        render json: output
      end

      format.json do
        notebook = Notebook.find(params.require(:id))
        authorize(notebook, :update?)

        new_params = notebook_params

        if new_params[:content]
          new_params[:content] = ActiveSupport::JSON.encode(new_params[:content])
        end

        notebook.update(new_params.to_unsafe_h)

        output = notebook.as_json

        output['content'] = ActiveSupport::JSON.decode(notebook.content)

        render json: output
      end
    end
  end

  def destroy
    notebook = @project.notebooks.find(params.require(:id))

    if notebook.destroy
      head :ok
    else
      render json: notebook.errors, status: :unprocessable_entity
    end
  end

  private

  def notebook_params
    params.require(:notebook).permit(:name).tap do |whitelisted|
      # allows for permitting any values inside of the content hash, from https://github.com/rails/rails/issues/9454
      whitelisted[:content] = params[:notebook][:content] if params[:notebook][:content]
    end
  end
end
