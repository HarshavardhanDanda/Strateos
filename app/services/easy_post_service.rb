class EasyPostService

  STRATEOS_PHONE = '650-763-8432'

  # $USD
  PRICES = {
    'micro-1.5' => 0.03,
    '96-pcr' => 2.49
  }

  WEIGHTS = {
    'micro-1.5' => 0.03,
    '96-pcr'    => 1.5,
    'a1-vial'   => 270,
    'd1-vial'   => 331,
    'd2-vial'   => 300
  }

  MULTIPLIER = {
    'micro-1.5' => 54,
    'a1-vial'   => 24,
    'd1-vial'   => 12,
    'd2-vial'   => 8
  }

  # For intake kits, we send FedExPak: https://www.easypost.com/what-predefined-package-options-are-valid-with-fedex.html
  # For Return / Dry Ice Shipments we use the following dimensions
  LENGTH = 12
  WIDTH  = 10
  HEIGHT = 11
  HS_TARIFF_NUM = 392_690
  ORIGIN_COUNTRY = 'US'

  def self.create_address(address)
    EasyPost::Address.create(
      name:        address.attention,
      company:     address.organization.name,
      street1:     address.street,
      street2:     address.street_2,
      city:        address.city,
      state:       address.state,
      zip:         address.zipcode,
      country:     address.country,
      phone:       STRATEOS_PHONE # Fedex requires a phone, default to us
    )
  end

  def self.create_and_purchase_intake_kit_shipment(intake_kit, address, lab_address)
    customs_info = if address.country != 'US' then create_customs_info(intake_kit) end
    parcel       = EasyPost::Parcel.create(predefined_package: 'FedExPak', weight: 16)
    shipment     = EasyPostService.create_outbound_shipment(address, lab_address, parcel, customs_info: customs_info)
    # Just take the cheapest rate for sending kits since they are not time sensitive
    shipment.buy(rate: shipment.lowest_rate)
    shipment
  end

  def self.create_customs_info(intake_kit)
    intake_kit_items = intake_kit.intake_kit_items
    plates = intake_kit_items.where(container_type_id: '96-pcr').map(&:quantity).sum
    tubes  = intake_kit_items.where(container_type_id: 'micro-1.5').map(&:quantity).sum * MULTIPLIER['micro-1.5']
    a1_vials = intake_kit_items.where(container_type_id: 'a1-vial').map(&:quantity).sum * MULTIPLIER['a1-vial']
    d1_vials = intake_kit_items.where(container_type_id: 'd1-vial').map(&:quantity).sum * MULTIPLIER['d1-vial']
    d2_vials = intake_kit_items.where(container_type_id: 'd2-vial').map(&:quantity).sum * MULTIPLIER['d2-vial']

    plate_custom_item = EasyPostService.create_custom_item('96 Well Plate', plates, '96-pcr', ORIGIN_COUNTRY,
HS_TARIFF_NUM)

    tube_custom_item = EasyPostService.create_custom_item('1.5ml Tube', tubes, 'micro-1.5', ORIGIN_COUNTRY,
HS_TARIFF_NUM)

    a1vials_custom_item = EasyPostService.create_custom_item('A1 vial', a1_vials, 'a1-vial', ORIGIN_COUNTRY,
HS_TARIFF_NUM)

    d1vials_custom_item = EasyPostService.create_custom_item('D1 vial', d1_vials, 'd1-vial', ORIGIN_COUNTRY,
HS_TARIFF_NUM)

    d2vials_custom_item = EasyPostService.create_custom_item('HRD2 vial', d2_vials, 'd2-vial', ORIGIN_COUNTRY,
HS_TARIFF_NUM)

    EasyPost::CustomsInfo.create(
      customs_items: [ plate_custom_item, tube_custom_item, a1vials_custom_item, d1vials_custom_item,
d2vials_custom_item ].compact,
      contents_type: 'sample',
      restriction_type: 'none',
      customs_certify: true,
      customs_signer: 'Yin He',
      # easy post docs (shipment value < $2500)
      eel_pfc: 'NOEEI 30.37(a)'
    )
  end

  def self.create_custom_item(description, quantity, type, origin_country, hs_tariff_number)
    if quantity > 0
      EasyPost::CustomsItem.create(
        description: description,
        quantity: quantity,
        value: quantity * ContainerType.find(type)&.cost_each.to_f,
        weight: quantity * WEIGHTS[type],
        origin_country: origin_country,
        # hts.usitc.gov
        hs_tariff_number: hs_tariff_number
      )
    end
  end

  def self.create_return_shipment(address, lab_address, total_weight, dry_ice_weight = 0)
    parcel = EasyPost::Parcel.create(length: LENGTH, width: WIDTH, height: HEIGHT, weight: total_weight)
    EasyPostService.create_outbound_shipment(address, lab_address, parcel, dry_ice_weight: dry_ice_weight)
  end

  def self.create_outbound_shipment(address, lab_address, parcel, dry_ice_weight: 0, customs_info: nil)
    from_address = EasyPostService.create_address(lab_address)
    to_address   = EasyPostService.create_address(address)

    # required for fedex reference section to be set.
    custom_options = {
      print_custom_1: 'Ops'
    }

    shipment_data = {
      to_address:       to_address,
      from_address:     from_address,
      options:          custom_options,
      parcel:           parcel,
      carrier_accounts: [ 'FedEx' ],
      reference: 'Ops'
    }

    if customs_info
      shipment_data[:customs_info] = customs_info
    end

    if dry_ice_weight > 0
      shipment_data[:options] = {
        dry_ice: 1,
        dry_ice_weight: dry_ice_weight
      }
    end

    EasyPost::Shipment.create(shipment_data)
  end

  def self.get_ep_shipment(shipment_id)
    EasyPost::Shipment.retrieve(shipment_id)
  end
end
