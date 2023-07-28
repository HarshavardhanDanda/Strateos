module BillingContacts
  class ConfirmationsController < Devise::ConfirmationsController
    protected

    # The path used after confirmation.
    def after_confirmation_path_for(_resource_name, _resource)
      billing_contacts_confirmations_confirmed_path
    end

    # The path used after resending confirmation instructions.
    def after_resending_confirmation_instructions_path_for(_resource_name)
      billing_contacts_confirmations_resent_path
    end
  end
end
