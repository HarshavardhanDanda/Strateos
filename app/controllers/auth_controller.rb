class AuthController < ActionController::Base
  respond_to :json

  def jwt_pub_key
    pubkey = ENV['JWT_PUBLIC_KEY']
    if pubkey.nil?
      render :status => 400, :plain => 'JWT authentication not configured in this environment'
    else
      render plain: pubkey, layout: false
    end
  end
end
