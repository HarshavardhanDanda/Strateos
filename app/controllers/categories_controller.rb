class CategoriesController < UserBaseController
  respond_to :json

  def index
    categories = Category.all
    render json: categories.as_json(only: [ :path, :id ])
  end

  def show
    category = Category.where(id: params.require(:id))
                       .includes({ materials: { material_components: [ :resource,
                        orderable_material_components: [ :container_type ] ] }}).first!
    render json: {
      id: category.id,
      path: category.path,
      materials: category.materials.where('deleted_at is null').includes(vendor: {}).as_json(Material.short_json)
    }
  end
end
