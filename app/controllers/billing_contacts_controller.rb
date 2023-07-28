class BillingContactsController < UserBaseController
  def index
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      authorize(@organization, :show?)
                      @organization
                    end
    billing_contacts = organization.billing_contacts
    render json: billing_contacts.as_json(BillingContact.full_json)
  end

  def create
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      current_admin || authorize(current_user, :can_mange_org?)
                      @organization
                    end
    billing_contact = BillingContact.new(**billing_contact_params, organization: organization)
    if billing_contact.save
      render json: billing_contact
    else
      render json: billing_contact.errors, status: :unprocessable_entity
    end
  end

  def update
    if params[:org_id]
      authorize(current_user, :can_manage_orgs_global?)
    else
      current_admin || authorize(current_user, :can_mange_org?)
    end
    billing_contact = BillingContact.find(params.require(:id))

    if billing_contact.update(billing_contact_params)
      render json: billing_contact
    else
      render json: billing_contact.errors, status: :unprocessable_entity
    end
  end

  def destroy
    if params[:org_id]
      authorize(current_user, :can_manage_orgs_global?)
    else
      current_admin || authorize(current_user, :can_mange_org?)
    end
    billing_contact = BillingContact.find(params.require(:id))

    if billing_contact.destroy
      render json: billing_contact
    else
      render json: billing_contact.errors, status: :unprocessable_entity
    end
  end

  private

  def billing_contact_params
    params.require(:billing_contact).permit(:name, :email)
  end
end
