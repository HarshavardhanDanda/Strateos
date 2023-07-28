class ContainerTypesController < ApplicationController

  # This information is inlined here to avoid complexity of adding another table, model, and controller.
  # If the information contained here gets much more complex, replace with a new table
  ORGANIZATION_SHIPPABLE_CONTAINER_TYPES = {
    "amgen-discovery-research" => [ "384-v-clear-clear", "384-flat-white-white-optiplate", "384-echo-ldv" ],
    "biodesy" => [ "384-echo" ],
    "catalog" => [ "384-echo" ],
    "lilly" => [ "384-echo", "384-echo-ldv" ],
    "lilly-test" => [ "384-echo", "384-echo-ldv" ],
    "pfizer" => [ "384-flat-white-white-tc", "384-flat-white-white-lv" ],
    "pliant-therapeutics" => [ "96-deep-kf" ],
    "erasca" => [ 'conical-15', 'conical-50', '384-echo-ldv' ]
  }

  SHIPPABLE_CONTAINER_TYPES = [ '96-pcr', 'micro-1.5', 'micro-2.0' ]

  def index
    container_types =
      if (admin_signed_in? && !masquerading?) || current_user&.is_internal_user?
        ContainerType.all
      elsif params[:shippable_subdomain]
        # TODO: Replace with JSON API instead of branching route
        org_shippable_ctypes = ORGANIZATION_SHIPPABLE_CONTAINER_TYPES[params[:shippable_subdomain]]
        shippable_names = SHIPPABLE_CONTAINER_TYPES + (org_shippable_ctypes || [])

        ContainerType.where(id: shippable_names)
      else
        ContainerType.user_facing
      end

    render json: container_types.as_json(ContainerType::FULL_JSON)
  end

  def show
    render json: ContainerType.find(params.require(:id))
  end
end
