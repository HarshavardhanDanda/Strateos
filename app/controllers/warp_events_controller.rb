class WarpEventsController < ApplicationController
  def warp_event_errors
    authenticate_admin!

    warp_errors = WarpEvent.joins(:warp)
                           .where(warp_state: "Failed")
                           .where(warps: { run_id: params[:id] })
    json_format = {
      include: [ :warp ],
      methods: []
    }

    render json: warp_errors.as_json(json_format)
  end
end
