class ReturnShipmentsController < UserBaseController

  def index
    render(json: ReturnShipment.where(organization: @organization)
                               .where.not(status: :created))
  end

  def shipability_info
    containers = Container.with_deleted.where(id: params.require(:container_ids), organization: @organization)
    errors     = ReturnShipment.shipability_info(containers, 'available').map { |error|
      [ error.container.id, error.message() ]
    }.to_h

    render(json: { errors: errors })
  end

  def create
    authorize(ReturnShipment.new(organization: @organization), :create?)
    containers = Container.where(id: params.require(:container_ids), organization: @organization)

    orgs = containers.map(&:organization_id).uniq

    if !(orgs.size == 1 && orgs[0] == @organization.id)
      raise "Can not return other organization's samples."
    end

    is_lab_same = containers.map(&:lab_id).uniq.size == 1

    if !is_lab_same
      raise "Can not create return shipment of containers belonging to different labs."
    end

    is_courier_pickup = params.require(:is_courier_pickup)

    # This seems odd. Why throw away temperature validation?
    if is_courier_pickup
      temp    = nil
      speed   = nil
      address = Address.find_by(id: params.require(:address_id), organization: @organization)
      carrier = params.require(:carrier)
      tracking_number = Shipment.generate_uniq_shipment_codes(1)[0]
    else
      temp    = params.require(:temp)
      speed   = params.require(:speed)
      address = Address.find_by(id: params.require(:address_id), organization: @organization)
      carrier = nil # populated later
      tracking_number = nil # populated later
    end

    lab_id = containers.first.lab&.id
    lab = Lab.find(lab_id)

    return_shipment = ReturnShipment.new(
      is_courier_pickup: is_courier_pickup,
      carrier: carrier,
      tracking_number: tracking_number,
      address: address,
      temp: temp,
      speed: speed,
      containers: containers,
      organization: @organization,
      lab: lab
    )
    begin
      return_shipment.save_with_new_details()
      container_ids = return_shipment.containers.pluck(:id).join("', '")
      delivery_method = is_courier_pickup ? return_shipment.carrier : 'Strateos EasyPost'
      description = "A shipment '#{return_shipment.id}' is created for the return of containers '#{container_ids}'"\
                    " to the address '#{return_shipment.address}' by '#{delivery_method}'"
      event_type = AuditTrail::EventType::CREATE
      _audit_trail_log(return_shipment, description, event_type)
    rescue ReturnShipmentError => e
      return render json: { error_message: e.message }, status: :bad_request
    end

    render json: return_shipment, status: :created
  end

  def update
    return_shipment = ReturnShipment.find(params.require(:id))
    authorize(return_shipment, :update?)

    if params.require(:is_courier_pickup)
      temp    = nil
      speed   = nil
      address = Address.find_by(id: params.require(:address_id), organization: @organization)
      is_courier_pickup = true
      carrier = params.require(:carrier)
    else
      temp    = params.require(:temp)
      speed   = params.require(:speed)
      address = Address.find_by(id: params.require(:address_id), organization: @organization)
      is_courier_pickup = false
      carrier = nil
    end

    attrs = {
      address: address,
      temp: temp,
      speed: speed,
      carrier: carrier,
      is_courier_pickup: is_courier_pickup
    }

    if is_courier_pickup && !return_shipment.tracking_number
      attrs[:tracking_number] = Shipment.generate_uniq_shipment_codes(1)[0]
    end

    return_shipment.attributes = attrs

    container_ids = params.require(:container_ids)
    # size comparison for speed because container substitution not available in UI
    containers_changed = (return_shipment.containers.size != container_ids.size)

    if return_shipment.changed? or containers_changed
      # something has changed and we need to get a new quote
      containers = Container.where(id: container_ids, organization: @organization)
      return_shipment.containers = containers if containers_changed

      begin
        return_shipment.save_with_new_details()
      rescue ReturnShipmentError => e
        return render json: { error_message: e.message }, status: :bad_request
      end
    end

    render json: return_shipment, status: :ok
  end

  def authorize_shipment
    return_shipment = ReturnShipment.find(params.require(:id))
    authorize(return_shipment, :update?)

    begin
      return_shipment.authorize(params.permit(:payment_method_id)[:payment_method_id])
    rescue ReturnShipmentError => e
      return render json: { error_message: e.message }, status: :bad_request
    end

    SlackMessageForReturnShipmentJob.perform_async(return_shipment.lab.operated_by.subdomain)

    render json: return_shipment, status: :ok
  end

  def destroy_abandoned
    return_shipment = ReturnShipment.find(params.require(:id))
    authorize(return_shipment, :destroy_abandoned?)

    begin
      return_shipment.destroy_abandoned
    rescue ReturnShipmentError => e
      return render json: { error_message: e.message }, status: :bad_request
    end

    render json: return_shipment, status: :ok
  end

  private

  def _audit_trail_log(return_shipment, description, event_type)
    resource_data_param = { :id => return_shipment.id, :name => "ReturnShipment", :type => return_shipment.class.name }
    AuditTrail::APIAuditDataStore.add_audit_message(event_type, resource_data_param, description)
  end
end
