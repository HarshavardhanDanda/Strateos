class ShipmentsController < UserBaseController

  def index
    authorize(Shipment.new, :index?)
    shipments = @organization.shipments.order('created_at desc')
    render json: shipments.as_json(Shipment::SHORT_JSON)
  end

  def show
    shipment = Shipment.find params[:id]

    authorize(shipment, :show?)

    render json: shipment.as_json(Shipment::FULL_JSON)
  end

  def create
    shipment = Shipment.new(params.require(:shipment).to_unsafe_h)
    shipment.organization_id = @organization.id
    shipment.user_id = current_user.try(:id)

    authorize(shipment, :create?)

    container_ids = params[:container_ids]

    code_count     = container_ids.size
    shipment_codes = Shipment.generate_uniq_shipment_codes(code_count)

    ActiveRecord::Base.transaction do
      shipment.save!
      if container_ids
        Container.find(container_ids).each_with_index do |c, index|
          authorize(c, :update?)
          c.update!(shipment_id: shipment.id, shipment_code: shipment_codes[index])
        end
      end
    end

    render json: shipment.as_json(Shipment::FULL_JSON), status: :created
  end

  private

  def shipment_params
    whitelisted = params.require(:shipment).permit(:shipment_type)
    whitelisted[:data] = params[:shipment][:data]
    whitelisted
  end
end
