class StaleContainersController < UserBaseController

  def update
    stale_container = StaleContainer.find(params.require(:id))

    update =
      if params[:requested_extension_at]
        stale_container.flag_for_extension
      end

    if update
      render json: stale_container
    else
      render json: stale_container.errors, status: :unprocessable_entity
    end
  end

end
