class AddressesController < UserBaseController
  before_action :authenticate_admin!, only: [ :approve ]

  def index
    organization = if params[:org_id]
                     authorize(current_user, :can_manage_orgs_global?)
                     Organization.find(params[:org_id])
                   else
                     @organization
                   end
    render json: organization.addresses.order('created_at ASC')
  end

  def create
    organization = if params[:org_id]
                     authorize(current_user, :can_manage_orgs_global?)
                     Organization.find(params[:org_id])
                   else
                     current_admin || authorize(current_user, :can_mange_org?)
                     @organization
                   end
    @address = Address.new(address_params)
    @address.organization_id = organization.id

    # If the current address is to be set default, then set all existing addresses to not default
    if @address.is_default
      begin
        update_address(@address, organization)
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      else
        render json: @address, status: :created, location: organization_addresses_path(organization)
      end
    elsif @address.save
      render json: @address, status: :created, location: organization_addresses_path(@organization)
    else
      render json: @address.errors, status: :unprocessable_entity
    end
  end

  def update
    organization = if params[:org_id]
                     authorize(current_user, :can_manage_orgs_global?)
                     Organization.find(params[:org_id])
                   else
                     current_admin || authorize(current_user, :can_mange_org?)
                     @organization
                   end
    address = Address.find(params.require(:id))

    if address.has_references?
      new_address = nil
      begin
        ActiveRecord::Base.transaction do
          new_address = Address.create!(address.attributes.except('id', 'created_at'))
          update_address(new_address, organization)
          update_purchase_order(new_address)
          update_lab_address(new_address)
          address.destroy!
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      else
        render json: new_address
      end
    else
      begin
        update_address(address, organization)
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      else
        render json: address
      end
    end
  end

  def destroy
    if params[:org_id]
      authorize(current_user, :can_manage_orgs_global?)
    else
      current_admin || authorize(current_user, :can_mange_org?)
    end
    address = Address.find(params.require(:id))
    if address.destroy
      head :ok
    else
      render json: address.errors, status: :unprocessable_entity
    end
  end

  private

  def update_address(address, organization)
    if address_params["is_default"]
      ActiveRecord::Base.transaction do
        addresses = Address.where(organization_id: organization.id)
        addresses.each { |a| a.update!(is_default: false) }
        address.save!
      end
    else
      address.update!(address_params)
    end
  end

  def update_lab_address(new_address)
    if Lab.exists?(address_id: params[:id])
      Lab.where(address_id: params[:id]).update_all(address_id: new_address.id)
    end
  end

  def update_purchase_order(new_address)
    if PurchaseOrder.exists?(address_id: params[:id])
      PurchaseOrder.where(address_id: params[:id]).update_all(address_id: new_address.id)
    end
  end

  def address_params
    params.require(:address).permit(:attention, :street, :street_2, :state, :city, :zipcode, :country, :is_default)
  end
end
