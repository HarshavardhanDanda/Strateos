class PingController < ActionController::Base
  # not really necessary as we only have GET requests, but removes some brakeman security warnings
  protect_from_forgery :with => :null_session

  def ping
    render json: { ok: true, answer: 42 }, status: 200
  end
end
