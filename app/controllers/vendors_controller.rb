class VendorsController < UserBaseController
  before_action :authenticate_admin!, :except => [ :index, :show ]

  def index
    query = params.permit(:q)[:q]
    scope = Pundit.policy_scope!(pundit_user, Vendor)
    @vendors =
      if query
        scope.where("name ilike '%'||?||'%'", query)
      else
        scope.all
      end

    @vendors = @vendors.order 'created_at DESC'

    render json: {
      results: @vendors.as_json(admin_signed_in? ? Vendor::FULL_JSON : Vendor::SHORT_JSON),
      num_pages: 1,
      per_page: @vendors.length
    }
  end

  def show
    @vendor = Vendor.find(params.require(:id))

    render json: @vendor.as_json(admin_signed_in? ? Vendor::FULL_JSON : Vendor::SHORT_JSON)
  end

  def urls
    @urls = Material.all.group_by(&:vendor_id).map { |_k, v| v.map { |e| e[:url] } }.compact.flatten
    render json: @urls
  end

  def create
    @vendor = Vendor.new(params.require(:vendor).permit(:name))
    # authorize(@vendor, :create?)  # this method is restricted to admin by before_action

    if @vendor.save
      render json: @vendor, status: :created
    else
      render json: @vendor.errors, status: :unprocessable_entity
    end
  end

  def update
    @vendor = Vendor.find(params.require(:id))
    # authorize(@vendor, :update?)  # this method is restricted to admin by before_action

    if @vendor.update(params.require(:vendor).permit(:name))
      render json: @vendor
    else
      render json: @vendor.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @vendor = Vendor.find(params.require(:id))
    # authorize(@vendor, :destroy?)  # this method is restricted to admin by before_action
    @vendor.destroy

    head :ok
  end
end
