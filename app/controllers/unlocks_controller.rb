# This is overriding the default devise controller for unlocking locked user accounts.
class UnlocksController < Devise::UnlocksController
  respond_to :json
end
