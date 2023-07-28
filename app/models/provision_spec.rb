class ProvisionSpec < ApplicationRecord
  belongs_to :instruction
  belongs_to :resource

  def validate(auto = false)
    if instruction.nil?
      return [ false, [ "Provision instruction not found: #{instruction_id}" ] ]
    end

    unless instruction.op == 'provision' || instruction.op == 'dispense'
      return [ false, [ "Can only add provision_containers to provision and dispense instructions" ] ]
    end

    mode = instruction.parsed.measurement_mode
    success, errors = validate_transfers_schema(mode)
    return [ false, errors ] if not success

    return validate_sources(mode) if auto

    success, errors = validate_destinations
    return [ false, errors ] if not success

    validate_sources(mode)
  rescue RuntimeError => exception
    return [ false, exception.message ]
  end

  def validate_transfers_schema(mode)
    errors = JSON::Validator.fully_validate(mode == 'mass' ? SOLID_TRANSFERS_SCHEMA: LIQUID_TRANSFERS_SCHEMA, transfers)

    if errors.empty?
      [ true, [] ]
    else
      [ false, errors ]
    end
  end

  def validate_destinations
    # Validate that all transfers are specified and with the correct volumes

    destinations = normalized_instruction_destinations

    if destinations.size != transfers.size
      return [ false, [ "Must specify all provisions" ] ]
    end

    search_indices = (0...transfers.size).to_set
    destinations.each do |dest|
      index = find_transfer_index(dest, search_indices)

      unless index.present?
        return [ false, [ "Must specify all provisions" ] ]
      end

      search_indices.delete(index)
    end

    [ true, [] ]
  end

  def validate_sources(mode)
    # validate liquid transfer parameters
    transfers.each do |lt|
      cid      = lt["from"]
      well_idx = lt["from_well_idx"]

      source_container = Container.where(organization_id: nil).find_by_id(cid)
      source_aliquot   = Aliquot.find_by(container_id: cid, well_idx: well_idx)
      required_quantity  = transfers.reduce(0) do |sum, lt_tmp|
        if lt_tmp["from"] == cid && lt_tmp["from_well_idx"] == well_idx
          sum + lt_tmp[mode]
        else
          sum
        end
      end

      if source_container.nil?
        return [ false, [ "Cannot find source container: #{cid}" ] ]
      end

      if source_aliquot.nil?
        return [ false, [ "Cannot find source well: #{cid} #{well_idx}" ] ]
      end

      source_quantity = mode == 'mass' ? source_aliquot.mass_mg : source_aliquot.volume_ul
      if source_quantity < required_quantity
        return [ false, [ "Cannot satisfy transfer, not enough #{mode}" ] ]
      end
    end

    [ true, [] ]
  end

  def source_containers
    Container.find(source_container_ids)
  end

  def source_container_ids
    transfers.map { |lt| lt["from"] }
  end

  def ordered_transfers
    # Orders the liquid transfers as specified by the autoprotocol.

    ordered_transfers = []
    search_indices    = (0...transfers.size).to_set
    destinations      = normalized_instruction_destinations

    destinations.each do |dest|
      index = find_transfer_index(dest, search_indices)
      search_indices.delete(index)
      ordered_transfers << transfers[index]
    end

    ordered_transfers
  end

  def find_transfer_index(dest, search_indices)
    search_indices.find do |i|
      lt = transfers[i]

      dest[:refname] == lt["to"] and
        dest[:robot_idx] == dest[:container_type].robot_well(lt["to_well_idx"]) and
        dest[:volume] == lt["volume"]
    end
  end

  def normalized_instruction_destinations
    # Converts the instruction into a list of destination specifications
    # This is used to normalization between provision and dispense instructions
    # and then as means to validate the provision spec.

    parsed = instruction.parsed

    if instruction.op == 'provision'
      parsed.to.map do |to|
        volume    = to[:volume]
        refname   = to[:well][:container]
        well_idx  = to[:well][:well]

        ref = instruction.run.refs.find { |ref| ref.name == refname }
        if ref.nil?
          raise "Could not find \"#{ref}\" in instruction run refs: #{instructions.run.refs.pluck(:name)}"
        end
        ctype     = ref.container_type
        robot_idx = ctype.robot_well(well_idx)

        { refname: refname, container_type: ctype, robot_idx: robot_idx, volume: volume }
      end
    elsif instruction.op == 'dispense'
      refname = parsed.object
      ref     = instruction.run.refs.find { |ref_tmp| ref_tmp.name == refname }

      if ref.nil?
        raise "Could not find \"#{ref}\" in instruction run refs: #{instructions.run.refs.pluck(:name)}"
      end
      ctype = ref.container_type

      parsed.columns.map { |column_data|
        (0...ctype.row_count).map do |row|
          robot_idx = ctype.robot_well_from_row_col(row, column_data[:column])

          { refname: refname, container_type: ctype, robot_idx: robot_idx, volume: column_data[:volume] }
        end
      }.flatten
    else
      []
    end
  end

  # Finds all ProvisionSpecs for a given resource that has not yet been executed.
  def self.all_by_resource(resource_id)
    ProvisionSpec.joins(:instruction)
                 .where(instructions: { executed_at: nil })
                 .where(resource_id: resource_id)
  end

  # Calculates a map from container_id to total to-be provisioned volume for a given resource.
  def self.calculate_reserved_volumes(resource_id, ignored_instruction_id, measurement_key = "volume")
    provision_specs = ProvisionSpec.all_by_resource(resource_id)

    if ignored_instruction_id
      provision_specs = provision_specs.where.not(instructions: { id: ignored_instruction_id })
    end

    transfers       = provision_specs.map(&:transfers).flatten
    container_to_transfers = transfers.group_by { |lt| lt["from"] }

    container_to_transfers.map { |cid, lts|
      total_volume = lts.sum { |lt| lt[measurement_key] || 0 }
      [ cid, total_volume ]
    }.to_h
  end

  LIQUID_TRANSFERS_SCHEMA = {
    type: "array",
    items: [
      {
        type: "object", required: [ "from", "to", "from_well_idx", "to_well_idx", "volume" ],
        properties: {
          from:          { type: "string" },
          to:            { type: "string" },
          from_well_idx: { type: "integer", minimum: 0 },
          to_well_idx:   { type: "integer", minimum: 0 },
          volume:        { type: "number",  minimum: 0 }
        }
      }
    ]
  }

  SOLID_TRANSFERS_SCHEMA = {
    type: "array",
    items: [
      {
        type: "object", required: [ "from", "to", "from_well_idx", "to_well_idx", "mass" ],
        properties: {
          from:          { type: "string" },
          to:            { type: "string" },
          from_well_idx: { type: "integer", minimum: 0 },
          to_well_idx:   { type: "integer", minimum: 0 },
          mass:        { type: "number",  minimum: 0 }
        }
      }
    ]
  }

end
