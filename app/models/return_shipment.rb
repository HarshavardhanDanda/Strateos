class ReturnShipment < ApplicationRecord
  include Rails.application.routes.url_helpers

  has_snowflake_id('rets')

  has_many :return_samples, dependent: :destroy
  has_many :containers, through: :return_samples
  belongs_to :address, -> { with_deleted }
  belongs_to :organization
  belongs_to :invoice_item
  belongs_to :lab
  has_one :synthesis_program_item, as: :item
  has_one :synthesis_program, through: :synthesis_program_item

  SPEEDS = [ 'Express Saver', '2nd Day', 'Overnight' ]
  TEMPS = [ 'Ambient', 'Dry Ice' ]

  STATUSES = [
    'created',
    'authorized',
    'purchased',
    'shipped'
  ]

  validates :speed, inclusion: {
    in: SPEEDS,
    message: "%{value} is not a valid shipping speed (#{SPEEDS})"
  }, allow_nil: true # courier pickups don't need this

  validates :temp, inclusion: {
    in: TEMPS,
    message: "%{value} is not a valid shipping temp (#{TEMPS})"
  }, allow_nil: true # courier pickups don't need this

  validates :status, inclusion: {
    in: STATUSES,
    message: "%{value} is not a valid container status (#{STATUSES})"
  }

  def self.pending_shipments
    ReturnShipment.where(status: [ "authorized", "purchased" ])
  end

  # SUPER HACK
  # AdminJson wants to include all container's locations and their ancestors.
  # This ancestor call is very expensive, as it ends up serializing to the ancestor
  # and everything under the sun.
  #
  # Instead we use ancestors_as_json_flat to return less data, but then use this gross
  # method to rename the attribute back to the `ancestor` name.
  def self.to_admin_json(shipments)
    rs_as_json = shipments.as_json(ReturnShipment::ADMIN_JSON)

    # normalize to an array
    normalized_rs_as_json =
      if rs_as_json.is_a?(Array)
        rs_as_json
      else
        [ rs_as_json ]
      end

    locations = normalized_rs_as_json.map { |rs|
      rs["containers"].map { |c| c["location"] }.flatten.compact
    }.flatten

    # change each location's ancestors to the correct name.
    locations.each do |l|
      l["ancestors"] = l["ancestors_as_json_flat"]
      l.delete("ancestors_as_json_flat")
    end

    rs_as_json
  end

  ADMIN_JSON = {
    only: [ :id, :speed, :temp, :address_id, :weight, :quote, :ep_label_url,
           :status, :created_at, :organization_id, :is_courier_pickup, :carrier, :tracking_number, :delivery_date ],
    include: {
      organization: {
        only: [ :id, :name ],
        include: {},
        methods: []
      },
      containers: {
        only: [ :id, :barcode, :container_type_id, :label ],
        include: {
          location: {
            only: [ :id, :name, :row, :col ], # Return shipments pane depends on row,col,id to do sorting.
            include: {},
            methods: [ :ancestors_as_json_flat ]
          }
        },
        methods: []
      },
      address: {}
    },
    methods: []
  }.freeze

  def serializable_hash(opts = {})
    opts = {
      only: [
        :id, :speed, :temp, :address_id, :weight, :quote, :status, :created_at, :organization_id,
        :tracking_message, :delivery_date, :carrier, :tracking_number, :is_courier_pickup
      ],
      include: {
        containers: {
          only: [ :id, :container_type_id, :label, :barcode, :status ],
          include: {},
          methods: []
        }
      },
      methods: []
    }.merge(opts || {})
    super(opts)
  end

  def save_with_new_details
    ReturnShipment.shipability_info!(containers, 'available')
    lab_id = containers.first.lab&.id

    self.status = 'created'

    if is_courier_pickup
      self.quote = 0.00
    else
      self.weight = _get_calculated_shipping_weight
      self.quote = _get_shipping_rate(_get_ep_return_shipment(lab_id)).rate
    end

    self.save
  end

  def authorize(payment_method_id)
    raise DuplicateAuthorizationError unless status == 'created'

    if !is_courier_pickup
      raise InternationalShipmentError unless address.country == "US"
      payment_method = PaymentMethod.find_by(id: payment_method_id, organization: organization)
      raise NoReturnPaymentMethodError unless payment_method.present?
    end

    with_lock do
      ReturnShipment.shipability_info!(containers, 'available')

      if !is_courier_pickup
        # courier pickups are free
        invoice_items = InvoiceManager.add_charge("Return Shipment #{Date.today}",
                                                  quote,
                                                  payment_method.id,
                                                  netsuite_item_id: InvoiceItem::NETSUITE_ACCOUNT_SHIPPING_REVENUE,
                                                  autocredit: true)

        has_errors = invoice_items.any? { |ii| !ii.errors.empty? }
        raise InsufficientFundsForReturnError if invoice_items.empty? || has_errors

        # find invoice item that is not credit
        # TODO: remove invoice item field from return shipment.
        invoice_item = invoice_items.find { |ii| ii.payment_method_id.present? && ii.credit_id.nil? }

        self.update(invoice_item: invoice_item)
      end

      self.update(status: 'authorized')
      containers.each(&:prepare_for_shipment)
    end
  end

  def cancel
    raise UncancelableError unless status == 'authorized'

    transaction do
      containers.each do |con|
        con.update!(status: 'available')
      end

      self.destroy!
    end
  end

  def purchase
    raise DuplicatePurchaseError unless status == 'authorized'

    if is_courier_pickup
      raise PurchaseCourierPickupError
    end

    ReturnShipment.shipability_info!(containers, 'pending_return')
    lab_id = containers.first.lab&.id
    ep_shipment   = _get_ep_return_shipment(lab_id)
    shipping_rate = _get_shipping_rate(ep_shipment)

    with_lock do # rubocop:disable BlockLength
      begin
        ep_shipment.buy(rate: shipping_rate)
      rescue EasyPost::Error => e
        Rails.logger.warn("EasyPost Error: #{e.message}")

        if Rails.env.production?
          raise ReturnShipmentPartnerError
        else
          self.update(ep_label_url: 'test_url', status: 'purchased')
          return
        end
      end

      # if actual is less than quote adjust, otherwise eat difference
      if shipping_rate.rate.to_f < quote
        if invoice_item.invoice_id
          # create credit for overcharge
          Credit.create(
            amount: quote - shipping_rate.rate.to_f,
            name: "Credit from #{invoice_item.name}",
            organization: invoice_item.organization,
            credit_type: 'General'
          )
        else
          invoice_item[:charge] = quote - shipping_rate.rate.to_f
        end
      end

      self.update(
        ep_shipment_id: ep_shipment.id,
        ep_label_url: ep_shipment.postage_label.label_url,
        status: 'purchased'
      )
    end
  end

  def ship
    transaction do
      self.update(status: 'shipped')
      if self.is_courier_pickup
        self.update(delivery_date: DateTime.now)
      end
      containers.each(&:set_shipped)
    end
  end

  def destroy_abandoned
    if self.status == 'created'
      self.destroy
    else
      raise DestroyAbandonedError, self.status
    end
  end

  def self.shipability_info(containers, status)
    errors = []

    containers.each do |container|
      if !container.all_runs_closed?
        errors << UnavailableContainerError.new(container, true)
      elsif container.status != status
        errors << UnavailableContainerError.new(container, false)
      end
    end

    return errors
  end

  def self.shipability_info!(containers, status)
    errors = ReturnShipment.shipability_info(containers, status)

    # raise first shipability error
    if !errors.empty?
      raise errors[0]
    end
  end

  private

  TUBES_PER_TUBE_BOX = 81.0

  # weights in ounces (with padding for contents)
  WEIGHTS = {
    '384-pcr'           => 1.5,
    '384-v-clear-clear' => 1.5,
    '6-flat'            => 3.0,
    '96-pcr'            => 1.5,
    'dry_ice'           => 80.0,
    'dry_ice_box'       => 30.0, # this a best guess until I can weigh an actual box
    'fedex_pak'         => 1.0,
    'micro-1.5'         => 0.03,
    'tube_box'          => 6.0,
    'a1-vial'           => 1.0,
    'd1-vial'           => 1.0,
    'd2-vial'           => 1.0
  }

  # unitless relative one-dimensional (height) volume; assumes identical width and depth
  VOLUMES = {
    '384-pcr'           => 1,
    '384-v-clear-clear' => 1,
    '6-flat'            => 2,
    '96-pcr'            => 1,
    'dry_ice'           => 5,
    'shipping_box'      => 10,
    'tube_box'          => 5
  }

  def _get_calculated_shipping_weight
    weight = 0
    volume = 0
    tubes  = 0
    requires_dry_ice = temp == 'Dry Ice'

    containers.each do |container|
      if container.container_type.is_plate
        # TODO: add all weights and volumes to DB or at least the table
        weight += WEIGHTS[container.container_type_id] || 1.5
        volume += VOLUMES[container.container_type_id] || 1
      elsif container.container_type.is_tube
        tubes += 1
      else
        raise UnshippableContainerError.new(container)
      end
    end
    raise EmptyShipmentException if weight == 0 and tubes == 0

    tube_boxes = (tubes / TUBES_PER_TUBE_BOX).ceil
    volume += tube_boxes * VOLUMES['tube_box'] + (requires_dry_ice ? VOLUMES['dry_ice'] : 0)
    raise TooManyContainersError if volume > VOLUMES['shipping_box'] # a shipping box has 10 units of volume

    tube_weight = tube_boxes * WEIGHTS['tube_box']
    packaging_weight = requires_dry_ice ? WEIGHTS['dry_ice_box'] + WEIGHTS['dry_ice'] : WEIGHTS['fedex_pak']

    weight + tube_weight + packaging_weight
  end

  def _get_ep_return_shipment(lab_id)
    lab_address = if lab_id.nil?
                    Lab.find_by(name: 'Menlo Park').address
                  else
                    Lab.find(lab_id).address
                  end
    dry_ice_weight = temp == 'Dry Ice' ? WEIGHTS['dry_ice'] : 0
    EasyPostService.create_return_shipment(address, lab_address, weight, dry_ice_weight)
  end

  def _get_shipping_rate(ep_shipment)
    carriers = [ 'FedEx' ]

    services =
      if temp == 'Dry Ice' or speed == 'Overnight'
        [ 'PRIORITY_OVERNIGHT' ]
      elsif speed == '2nd Day'
        [ 'FEDEX_2_DAY' ]
      else
        [ 'FEDEX_EXPRESS_SAVER' ]
      end

    ep_shipment.lowest_rate(carriers, services)
  rescue EasyPost::Error => e
    Rails.logger.warn("EasyPost Error: #{e.message}")

    # EasyPost test environment doesn't always return useful rates
    if !Rails.env.production?
      if e.message == "No rates found."
        raise ReturnShipmentNoRatesError
      end
      ep_shipment.lowest_rate()
    elsif e.message == "No rates found."
      raise ReturnShipmentNoRatesError
    else
      raise ReturnShipmentPartnerError
    end
  end

end

class ReturnShipmentError < StandardError
end

class DestroyAbandonedError < ReturnShipmentError
  def initialize(shipment_status)
    @shipment_status = shipment_status
  end

  def message
    "Can not abandon a shipment that's status is #{@shipment_status}. Status "\
      "must be 'created'"
  end
end

class EmptyShipmentError < ReturnShipmentError
  def message
    "Shipment must contain at least one sample."
  end
end

class TooManyContainersError < ReturnShipmentError
  def message
    "Too many samples for shipping container."
  end
end

class NoReturnPaymentMethodError < ReturnShipmentError
  def message
    "This shipment requires a payment method."
  end
end

class InternationalShipmentError < ReturnShipmentError
  def message
    "Non-US addresses are not accepted here. "\
      "For international shipping, contact support@transcriptic.com."
  end
end

class InsufficientFundsForReturnError < ReturnShipmentError
  def message
    "This payment method has insufficient funds."
  end
end

class ReturnShipmentPartnerError < ReturnShipmentError
  def message
    "Our shipping partner is having issues. Please try again in a few minutes."
  end
end

class ReturnShipmentNoRatesError < ReturnShipmentError
  def message
    "No shipping rates were found for this address. Check that the selected address is correct."
  end
end

class DuplicateAuthorizationError < ReturnShipmentError
  def message
    "This shipment has already been authorized."
  end
end

class DuplicatePurchaseError < ReturnShipmentError
  def message
    "This shipment has already been purchased."
  end
end

class PurchaseCourierPickupError < ReturnShipmentError
  def message
    "This shipment doesn't require a purchase.  A courier will pick it up."
  end
end

class UncancelableError < ReturnShipmentError
  def messsage
    "This shipment cannot be canceled."
  end
end

class UnshippableContainerError < ReturnShipmentError
  attr_reader :container

  def initialize(container)
    @container = container
  end

  def message
    "Sample #{@container.id} (#{@container.container_type_id}) is not "\
      "in a shippable container (must be either 96-pcr, 384-pcr, 6-flat, 384-v-clear-clear, or micro-1.5/-2.0)."
  end
end

class UnavailableContainerError < ReturnShipmentError
  attr_reader :container, :pending

  def initialize(container, pending)
    @container = container
    @pending   = pending
  end

  def message
    if @pending
      "Sample #{@container.id} still has pending runs and cannot be shipped yet."
    elsif @container.status == 'destroyed'
      "Sample #{@container.id} has been destroyed."
    elsif @container.status == 'inbound'
      "Sample #{@container.id} has not yet reached our facilities."
    else
      "Sample #{@container.id} is not available for shipping."
    end
  end
end
