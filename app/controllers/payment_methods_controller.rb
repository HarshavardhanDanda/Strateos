class PaymentMethodsController < UserBaseController

  def index
    payment_method_organization = params[:payment_method][:organization_id]
    if payment_method_organization
      render json: PaymentMethod.where(organization_id: payment_method_organization)
    else
      render json: @organization.payment_methods
    end
  end

  def create
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      current_admin || authorize(current_user, :can_mange_org?)
                      @organization
                    end
    payment_params = payment_method_create_params
    payment_type   = payment_params[:type]

    unless [ 'CreditCard', 'PurchaseOrder' ].include? payment_type
      return render json: { type: [ 'must be either CreditCard or PurchaseOrder' ] }, status: :bad_request
    end

    if payment_type == 'PurchaseOrder'
      # verify that address exist
      Address.find payment_params.require(:address_id)
    end

    if payment_params[:upload_id]
      upload = Upload.find(payment_params[:upload_id])
      authorize(upload, :show?)

      # extract aws key from upload
      payment_params[:po_attachment_url] = upload.key
    end

    @card =
      if payment_type == 'PurchaseOrder'
        PurchaseOrder.new(payment_params.except(:type, :upload_id))
      else
        CreditCard.new(payment_params.except(:type, :upload_id))
      end
    @card.organization = organization

    if @card.save
      # Set this as the default payment method if:
      # - they asked us to (params[:set_as_default]), or
      # - it is the only valid payment method in the organization

      is_only_valid_payment_method =
        organization.valid_payment_methods.count == 1 and
        organization.valid_payment_methods[0] == @card

      if params[:payment_method][:set_as_default] or is_only_valid_payment_method
        organization.default_payment_method = @card
        organization.save
      end

      # notify admins when a new PO is created because it requires approval
      if payment_type == 'PurchaseOrder'
        SlackMessageForNewPoJob.perform_async(organization.name)
      end

      render json: @card, status: :created, location: organization_billing_path(organization)
    else
      render json: @card.errors, status: :unprocessable_entity
    end
  end

  def update
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      current_admin || authorize(current_user, :can_mange_org?)
                      @organization
                    end
    if params[:payment_method][:default]
      @card = organization.payment_methods.find(params.require(:id))

      if payment_method_update_params[:default]
        organization.default_payment_method = @card

        if not organization.save
          return render json: organization.errors, status: :unprocessable_entity
        end
      end
    else
      payment_params = payment_method_create_params
      payment_type   = payment_params[:type]
      payment_params[:po_approved_at] = params[:payment_method][:po_approved_at]
      @card = organization.payment_methods.find(params.require(:id))

      if payment_params[:upload_id]
        upload = Upload.find(payment_params[:upload_id])
        authorize(upload, :show?)

        # extract aws key from upload
        payment_params[:po_attachment_url] = upload.key
      end

      if payment_type == 'PurchaseOrder'
        SlackMessageForNewPoJob.perform_async(organization.name)
      end

      if not @card.update(payment_params.except(:type, :upload_id))
        return render json: @card.errors, status: :unprocessable_entity
      end
    end
    render json: organization.payment_methods
  end

  def destroy
    organization =  if params[:org_id]
                      authorize(current_user, :can_manage_orgs_global?)
                      Organization.find(params[:org_id])
                    else
                      current_admin || authorize(current_user, :can_mange_org?)
                      @organization
                    end

    @card = organization.payment_methods.find(params.require(:id))
    if @card.destroy
      render json: organization.payment_methods
    else
      render json: @card.errors, status: :unprocessable_entity
    end
  end

  private

  def payment_method_create_params
    p1 = params.require(:payment_method)
    payment_type = p1.require(:type)

    return {} unless [ 'CreditCard', 'PurchaseOrder' ].include? p1[:type]

    if payment_type == 'CreditCard'
      p1.permit(:type, :alias, :stripe_one_time_id, :org_id)
    else
      p1.permit(:type, :alias, :upload_id, :po_reference_number,
                :expiry, :po_limit, :address_id, :org_id)
    end
  end

  def payment_method_update_params
    params.require(:payment_method).permit(:default, :alias, :org_id)
  end
end
