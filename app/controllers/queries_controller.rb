class QueriesController < UserBaseController
  before_action :find_project_context

  def index
    render json: QueryManager::DEFAULT_QUERIES
  end

  def show
    render json: QueryManager.execute(params[:id], @project, current_user || current_admin)
  end
end
