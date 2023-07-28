class TwoFactorAuthenticationController < Devise::TwoFactorAuthenticationController
  layout 'unauthenticated'

  def register
    return if admin_signed_in?
    if current_user
      current_user.maybe_set_otp
      @qrcode = RQRCode::QRCode.new(current_user.provisioning_uri("Transcriptic: #{current_user.email}"))
    end
    render :register
  end

  def after_two_factor_success_for(_resource)
    _resource.update(two_factor_auth_enabled: true)
    super(_resource)
  end
end
