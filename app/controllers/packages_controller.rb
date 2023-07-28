class PackagesController < UserBaseController
  before_action :set_package, only: [ :update, :destroy ]

  def index
    authorize(@organization, :show?)

    render json: @organization.packages.as_json(Package.short_json)
  end

  def show
    set_package
    json_format = params[:short_json] ? Package.short_json : Package.full_json
    render json: @package.as_json(json_format)
  end

  def create
    authorize(Package, :create?)

    @package              = Package.new(new_package_params)
    @package.owner        = current_user
    @package.organization = @organization

    if @package.save
      render json: @package, status: :created
    else
      render json: @package.errors, status: :unprocessable_entity
    end
  end

  def update
    authorize(@package, :update?)

    if @package.update(package_params)
      render json: @package, status: 200
    else
      render json: @package.errors, status: :unprocessable_entity
    end
  end

  def destroy
    authorize(@package, :destroy?)

    @package.destroy

    head :ok
  end

  private

  def set_package
    @package = Package.find(params[:id])
    authorize(@package, :show?)
  end

  def new_package_params
    params.require(:package)
          .permit(:name, { acl: [] }, :description)
  end

  def package_params
    params.require(:package).permit(:description, :public)
  end
end
