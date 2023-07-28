class PasswordsController < Devise::PasswordsController
  respond_to :json

  def update
    super do |user|
      # after updating the User or Admin password
      # make sure that we are no longer forcing update which avoids an infinite loop.
      if user.errors.empty?
        user.force_change_password = false
        user.save
      end
    end
  end
end
