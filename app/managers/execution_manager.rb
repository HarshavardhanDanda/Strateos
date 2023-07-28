class ExecutionManager

  def initialize(refs)
    @refs = refs
  end

  def execute(instructions, recorded_at: nil)
    context = ExecutionContext.new(@refs, recorded_at: recorded_at)

    # Use the SQL query cache to improve performance.
    ActiveRecord::Base.cache do
      instructions.each { |inst| context.execute_instruction(inst) }
    end

    context
  end

  def dataset_attached(instruction, recorded_at: nil)
    context = ExecutionContext.new(@refs, recorded_at: recorded_at)
    context.dataset_attached(instruction)

    context
  end

  def execute_liquid_sensing(instruction, aliquot, calibrated_sensed_volume, sensing_method, flagged_transfer, force)
    context = ExecutionContext.new(@refs)
    context.execute_liquid_sensing(
      instruction,
      aliquot,
      calibrated_sensed_volume,
      sensing_method,
      flagged_transfer,
      force
    )
  end
end

class ExecutionContext
  DSL = Autoprotocol::Schema::DSL
  attr_reader :active_record_objs

  def initialize(refs, recorded_at: Time.now)
    @refs        = refs
    @instruction = nil
    @recorded_at = recorded_at
    @current_volume_by_aliquot = {}
    @current_mass_by_aliquot = {}

    # objs to be saved
    @active_record_objs = []
    @active_record_ids  = Set.new

    # objs to be deleted
    @active_record_destroy_objs = []
    @active_record_destroy_ids  = Set.new

    # sequential list of liquid transfers [{ from: aliquot, to: aliquot }]
    # used for calculating aliquot composition changes
    @transfers = []
  end

  def execute_instruction(instruction)
    @instruction = instruction

    # check to see if an actual measurement was made by the device. If an actual measurement was made and it was stored
    # in the operation_as_executed field, we should execute the instruction with that measurement. If it is null,
    # proceed with the intended values described in the operation field
    if @instruction.operation_as_executed.present?
      @instruction.operation_as_executed_parsed.execute(self)
    else
      @instruction.parsed.execute(self)
    end
  end

  def dataset_attached(instruction)
    @instruction = instruction
    @instruction.parsed.dataset_attached(instruction.dataset, self)
  end

  def execute_liquid_sensing(instruction, aliquot, calibrated_sensed_volume, sensing_method, flagged_transfer, force)
    @instruction = instruction

    # check if it is a run belonging to a test organization
    # if not, the effect won't be applied
    should_apply = force || instruction.organization&.test_account?

    starting_volume = aliquot.volume_ul
    volume_adjustment =
      if should_apply
        calibrated_sensed_volume - starting_volume
      else
        nil
      end

    Rails.logger.info "[liquid sensing test] For aliquot #{aliquot.container_id}/#{aliquot.well_idx}," \
                      "sensed volume: #{calibrated_sensed_volume}, original volume: #{starting_volume}, " \
                      "should apply: #{should_apply}, flagged: #{flagged_transfer}, sensing method: #{sensing_method}"

    if flagged_transfer
      effect = aliquot.make_liquid_sensing_effect(aliquot,
                                                  calibrated_sensed_volume,
                                                  volume_adjustment,
                                                  instruction: @instruction)
      if should_apply && starting_volume.present?
        offset_ratio = calibrated_sensed_volume / starting_volume
        # An aliquot can have multiple aliquot compound links. Updates the millimolar quantity for all aliquot compound
        # links by the offset_ratio. Assumes a homogenous solution. This works because this is liquid sensing
        aliquot.aliquots_compound_links&.filter(&:m_moles).each do |acl|
          acl.m_moles = acl.m_moles * offset_ratio
          save_later(acl)
        end
        aliquot.volume_ul += volume_adjustment
        save_later(aliquot)
      end
      record_effect(effect)
      persist_all
      batch_async_reindex(@active_record_objs + @active_record_destroy_objs)
    end
  end

  def save_later(active_record_obj)
    id = active_record_obj.id

    if !@active_record_ids.include?(id) || id.blank?
      unless id.blank?
        @active_record_ids << id
      end
      @active_record_objs << active_record_obj
    end
  end

  def destroy_later(active_record_obj)
    id = active_record_obj.id

    # remove from mutated list
    if @active_record_ids.include?(id)
      @active_record_ids.delete(id)
      @active_record_objs.delete(active_record_obj)
    end

    # add to destroy list
    if !@active_record_destroy_ids.include?(id)
      @active_record_destroy_ids << id
      @active_record_destroy_objs << active_record_obj
    end
  end

  def persist_all
    # Save all records and update compositions
    ActiveRecord::Base.transaction do
      Searchkick.callbacks(false) do
        save_all_internal(@active_record_objs)
        destroy_all_internal(@active_record_destroy_objs)
        update_compositions
      end
    end
    # After saving, reindex all affected records
    batch_async_reindex(@active_record_objs + @active_record_destroy_objs)
  end

  def save_all_of_type(cls)
    objs = @active_record_objs.select { |o| o.instance_of?(cls) }
    save_all_internal(objs)
    batch_async_reindex(objs)
  end

  def find_container(refname)
    @refs[refname]
  end

  def find_aliquot(refname, well_idx)
    container = find_container(refname)
    find_aliquot_by_container(container, well_idx)
  end

  def find_aliquot_by_container(container, well_idx)
    aliquots  = container.aliquots
    robot_idx = container.container_type.robot_well(well_idx)
    aliquot   = aliquots.find { |aq| aq.well_idx == robot_idx }

    if not aliquot
      aliquot              = Aliquot.new
      aliquot.id           = Aliquot.generate_snowflake_id
      aliquot.container_id = container.id
      aliquot.well_idx     = robot_idx
      aliquot.volume_ul    = 0

      container.association(:aliquots).add_to_target(aliquot)
      save_later(aliquot)
    end

    aliquot
  end

  def find_provision_spec
    ProvisionSpec.find_by(instruction_id: @instruction.id)
  end

  def find_aliquot_by_ref(ref)
    if ref
      ref_container = @refs[ref[:container]]
      ref_ctype     = ref_container.container_type
      well_idx = ref_ctype.robot_well(ref[:well])
      find_aliquot_by_container(ref_container, well_idx)
    end
  end

  def stamp_liquid(from_ref, to_ref, volume_ul, tip_layout = 'SBS96', rows: 8, columns: 12)
    if from_ref
      from_container = @refs[from_ref[:container]]
      from_ctype     = from_container.container_type
      init_from_well = from_ctype.robot_well(from_ref[:well])
    end

    if to_ref
      to_container = @refs[to_ref[:container]]
      to_ctype     = to_container.container_type
      to_ctype     = to_container.container_type
      init_to_well = to_ctype.robot_well(to_ref[:well])
    end

    0.upto(rows - 1) do |row|
      0.upto(columns - 1) do |col|

        stamp_from_ref =
          if from_ref
            from_well =
              if tip_layout == 'SBS96'
                from_ctype.robot_well_from_sbs96_shape(init_from_well, row, col)
              else
                from_ctype.robot_well_from_sbs384_shape(init_from_well, row, col)
              end

            { container: from_ref[:container], well: from_well }
          end

        stamp_to_ref =
          if to_ref
            to_well =
              if tip_layout == 'SBS96'
                to_ctype.robot_well_from_sbs96_shape(init_to_well, row, col)
              else
                to_ctype.robot_well_from_sbs384_shape(init_to_well, row, col)
              end

            { container: to_ref[:container], well: to_well }
          end

        move_liquid(stamp_from_ref, stamp_to_ref, volume_ul)
      end
    end
  end

  def process_provision_spec(provision_spec, resource = nil)
    source_containers = provision_spec.source_containers

    provision_spec.transfers.each do |lt|
      from_container = source_containers.find { |c| c.id == lt["from"] }
      to_container   = find_container(lt["to"])
      from_aliquot   = find_aliquot_by_container(from_container, lt["from_well_idx"])
      to_aliquot     = find_aliquot_by_container(to_container,   lt["to_well_idx"])
      volume_ul      = lt["volume"].to_d

      move_liquid_by_aliquot(from_aliquot,
                             to_aliquot,
                             volume_ul,
                             from_stock: true,
                             tentative_resource: resource)

      # need to use `to_a` here because the active record association cache get confused.
      # Calling `sum` finds the old value without doing to_a.
      if from_container.aliquots.to_a.sum(&:volume_ul) <= 0
        destroy_later(from_container)
      end
    end
  end

  def move_liquid(from_ref, to_ref, volume_ul, from_stock: false, tentative_resource: nil)
    from_aliquot =
      if from_ref.present?
        find_aliquot(from_ref[:container], from_ref[:well])
      end

    to_aliquot =
      if to_ref.present?
        find_aliquot(to_ref[:container], to_ref[:well])
      end

    move_liquid_by_aliquot(from_aliquot,
                           to_aliquot,
                           volume_ul,
                           from_stock: from_stock,
                           tentative_resource: tentative_resource)
  end

  def move_liquid_by_aliquot(from_aliquot, to_aliquot, volume_ul,
                             from_stock: false, tentative_resource: nil)

    is_zero_volume_transfer = volume_ul == 0

    # a zero volume transfer is considered a no-op. In this case we do no want to propagate resources, compounds and we
    # do not want to create aliquot_events.
    if is_zero_volume_transfer
      return
    end

    if from_aliquot

      if @current_volume_by_aliquot[from_aliquot].nil?
        @current_volume_by_aliquot[from_aliquot] = from_aliquot.volume_ul
      end

      if from_aliquot.volume_ul == 0 || from_aliquot.volume_ul.nil?
        return
      end

      from_aliquot.volume_ul -= volume_ul

      from_effect = from_aliquot.make_transfer_effect(effect_type: 'liquid_transfer_out',
                                                      to_aliquot: to_aliquot,
                                                      volume_ul: volume_ul,
                                                      instruction: @instruction)
      save_later(from_aliquot)
      record_effect(from_effect)
    end

    if to_aliquot

      if @current_volume_by_aliquot[to_aliquot].nil?
        @current_volume_by_aliquot[to_aliquot] = to_aliquot.volume_ul
      end

      tentative_resource ||= from_aliquot.try(:resource)
      ##
      ## Earlier there was check for `to_aliquot.new_record?`.
      ## Actually there is no need to have this check since we always want to progagate source aliquot
      ## resources into destination aliquot
      if tentative_resource.present?
        to_aliquot.resource = tentative_resource
      end

      if to_aliquot.volume_ul.present?
        to_aliquot.volume_ul += volume_ul
      end

      save_later(to_aliquot)

      to_effect = to_aliquot.make_transfer_effect(effect_type: 'liquid_transfer_in',
                                                  from_aliquot: from_aliquot,
                                                  from_effect: from_effect,
                                                  volume_ul: volume_ul,
                                                  is_stock: from_stock,
                                                  instruction: @instruction)
      record_effect(to_effect)
    end

    # composition of to_aliquot will change
    if from_aliquot && to_aliquot
      record_transfer(from_aliquot, to_aliquot, :liquid, volume_ul)
    end
  end

  def process_mass_provision_spec(provision_spec)
    source_containers = provision_spec.source_containers

    provision_spec.transfers.each do |lt|
      from_container = source_containers.find { |c| c.id == lt["from"] }
      to_container   = find_container(lt["to"])
      from_aliquot   = find_aliquot_by_container(from_container, lt["from_well_idx"])
      to_aliquot     = find_aliquot_by_container(to_container,   lt["to_well_idx"])
      mass_mg = lt["mass"].to_d

      move_solid_by_aliquot(from_aliquot,
                            to_aliquot,
                            mass_mg * 1000)

      # need to use `to_a` here because the active record association cache get confused.
      # Calling `sum` finds the old value without doing to_a.
      if from_container.aliquots.to_a.sum(&:mass_mg) <= 0
        destroy_later(from_container)
      end
    end
  end

  def move_solid(from_ref, to_ref, mass_microgram)
    from_aliquot =
      if from_ref.present?
        find_aliquot(from_ref[:container], from_ref[:well])
      end

    to_aliquot =
      if to_ref.present?
        find_aliquot(to_ref[:container], to_ref[:well])
      end

    move_solid_by_aliquot(from_aliquot, to_aliquot, mass_microgram)
  end

  def get_mass_milligrams(mass)
    mass_schema = DSL.build do
      Mass()
    end
    mass_schema.parse(mass).value / 1000
  end

  def move_solid_by_aliquot(from_aliquot, to_aliquot, mass_microgram)

    is_zero_mass_transfer = mass_microgram == 0

    # a zero mass transfer is considered a no-op. In this case we do no want to propagate resources, compounds and we
    # do not want to create aliquot_events.
    if is_zero_mass_transfer
      return
    end

    mass_schema = DSL.build do
      Mass()
    end

    if from_aliquot
      # measure_mass adds mass in container's properties. For backward compatibility,
      # mass depicted in properties should be looked up and taken into account.
      from_mass = from_aliquot.container[:properties]['Last Mass']
      if from_mass.present?
        last_from_measured_mass = mass_schema.parse(from_mass).value
      end

      from_aliquot_total_mass = if from_aliquot.mass_mg.present?
                                  from_aliquot.mass_mg
                                else
                                  last_from_measured_mass.present? ? last_from_measured_mass / 1000 : nil
                                end

      if from_aliquot_total_mass == 0 || from_aliquot_total_mass.nil?
        return
      end

      if @current_mass_by_aliquot[from_aliquot].nil?
        @current_mass_by_aliquot[from_aliquot] = from_aliquot_total_mass
      end

      # if there is only measure_mass data on the container, use that value
      # to update mass_mg. Note: Mass unit is based on the microgram. Hence, `mass_mg`
      # value must be converted to and from microgram to update the aliquot mass.
      if last_from_measured_mass.present? && from_aliquot.mass_mg.nil?
        from_aliquot.mass_mg = (last_from_measured_mass - mass_microgram) / 1000
      # if mass_mg is present, use that value to update mass_mg by default.
      elsif from_aliquot.mass_mg.present?
        from_aliquot.mass_mg -= (mass_microgram / 1000)
      # if neither mass_mg nor measured_mass is present, remain nil (instead of
      # updating it with a negative value).
      else
        from_aliquot.mass_mg = nil
      end

      from_effect = from_aliquot.make_transfer_effect(
        effect_type: 'solid_transfer_out',
        to_aliquot: to_aliquot,
        mass_mg: (mass_microgram / 1000),
        instruction: @instruction
      )

      save_later(from_aliquot)
      record_effect(from_effect)
    end

    if to_aliquot
      to_mass = to_aliquot.container[:properties]['Last Mass']
      if to_mass.present?
        last_to_measured_mass = mass_schema.parse(to_mass).value
      end

      if last_to_measured_mass.present? && to_aliquot.mass_mg.nil?
        to_aliquot.mass_mg = (last_to_measured_mass + mass_microgram) / 1000
      elsif to_aliquot.mass_mg.present?
        to_aliquot.mass_mg += (mass_microgram / 1000)
      elsif to_aliquot.mass_mg.nil?
        to_aliquot.mass_mg = mass_microgram / 1000
      end

      if @current_mass_by_aliquot[to_aliquot].nil?
        @current_mass_by_aliquot[to_aliquot] = to_aliquot.mass_mg
      end

      to_effect = to_aliquot.make_transfer_effect(
        effect_type: 'solid_transfer_in',
        from_aliquot: from_aliquot,
        from_effect: from_effect,
        mass_mg: (mass_microgram / 1000),
        instruction: @instruction
      )

      save_later(to_aliquot)
      record_effect(to_effect)
    end

    if from_aliquot && to_aliquot
      record_transfer(from_aliquot, to_aliquot, :solid, mass_microgram)
    end
  end

  def empty_container(container)
    container.aliquots.each do |aliquot|
      effect = aliquot.make_transfer_effect(effect_type: 'liquid_transfer_out',
                                            to_aliquot: nil,
                                            volume_ul: aliquot.volume_ul,
                                            instruction: @instruction)
      record_effect(effect)

      aliquot.volume_ul = 0
      save_later(aliquot)
    end
  end

  def record_target_effect(target, opts)
    aliquot_effect = target.make_effect(opts)
    record_effect(aliquot_effect)

    aliquot_effect
  end

  def record_transfer(from_aliquot, to_aliquot, type = :liquid, amount = nil)
    @transfers << {
      from: from_aliquot,
      to: to_aliquot,
      type: type,
      amount: amount
    }
  end

  def exact_compound_search_by_smiles(smiles, org_id)
    identifiers = [ { notation: "smiles", value: smiles } ]
    compound_ids = CompoundServiceFacade::GetCompounds.call({ with_identifiers: identifiers },
                                                            CompoundServiceFacade::Scope::ALL)
                                                      .pluck(:compound_id).uniq
    if compound_ids.empty?
      add_error("there is no compound that matches the SMILES: #{smiles}")
      return {}
    end
    if compound_ids.size > 1
      Rails.logger.warn("there are multiple compound with the SMILES: #{smiles}")
    end
    compound_id = compound_ids[0]
    filter_params = { compound_id: compound_id, organization_id: [ nil, org_id ] }
    compound_links = CompoundServiceFacade::GetCompounds.call(filter_params, CompoundServiceFacade::Scope::ALL)
    # if there are multiple compound links returned, select compound link that belongs
    # to the org by default.
    if compound_links.length > 1
      compound_links = compound_links.select { |cl| cl[:organization_id] == org_id }
    end
    if compound_links.empty?
      add_error("there is no compound_link that matches the SMILES: #{smiles}")
      return {}
    else
      return compound_links[0].id
    end
  end

  def link_new_compound(aliquot, compounds, org_id)
    compound_link_ids = []
    compounds.each do |c|
      smiles = c["value"]
      # returns only one exactly matched compound per SMILES
      compound_link_id = exact_compound_search_by_smiles(smiles, org_id)
      unless compound_link_id.empty?
        compound_link_ids << compound_link_id
      end
    end
    aliquot.add_compound_links_by_id(compound_link_ids.uniq)
  end

  def record_informatics(instruction: @instruction)
    informatics = instruction.operation["informatics"]
    unless informatics.nil?
      org_id = instruction.organization.id
      informatics.each do |info|
        case info["type"]
        when Autoprotocol::Schema::Informatics::TYPE_ATTACH_COMPOUNDS
          aliquots = info["data"]["wells"]
          compounds = info["data"]["compounds"]
          al_schema = DSL.build do
            AliquotRef()
          end
          aliquots.each do |al|
            parse_al = al_schema.parse(al).value
            aliquot = find_aliquot(parse_al[:container], parse_al[:well])
            link_new_compound(aliquot, compounds, org_id)
          end
        end
      end
    end
  end

  def add_error(message)
    Rails.logger.error(message)
  end

  private

  def save_all_internal(objs)
    objs.each(&:run_bulk_import_callbacks)
    objs.group_by(&:class).each do |cls, objs_of_cls|
      cls.import! objs_of_cls,
                  batch_size: 1000,
                  on_duplicate_key_update: :all,
                  all_or_none: true,
                  recursive: cls == Aliquot # Recursively import aliquots to generate aliquot resource links
    end
  end

  # Reindex unique set of aliquots
  # Reindex unique set of containers from objs and from aliquot
  def batch_async_reindex(objs)
    containers_to_reindex = []
    objs.group_by(&:class).each do |cls, objs_of_cls|

      # Collect the container IDs
      if cls == Aliquot
        containers_to_reindex |= objs_of_cls.map(&:container)
      elsif cls == Container
        container_ids_to_reindex |= objs_of_cls.map(&:id)
      end

      # Reindex if reindexable and not Containers
      next unless cls.respond_to?(:searchkick_index) && cls != Container

      objs_of_cls.each(&:reindex)
    end

    # Reidex containers
    containers_to_reindex.each(&:reindex)
  end

  def update_compound_amounts(from_aliquot, to_aliquot, type, amount)
    source_aliquot_compounds = from_aliquot ? AliquotCompoundLink.where(aliquot_id: from_aliquot["id"]) : []
    dest_aliquot_compounds = AliquotCompoundLink.where(aliquot_id: to_aliquot["id"])

    source_aliquot_compounds.each do |source_aliquot_compound|
      dest_shared_aliquot_compound = dest_aliquot_compounds&.find do |target|
        source_aliquot_compound.compound_link_id == target.compound_link_id
      end

      is_shared_compound = dest_shared_aliquot_compound.present?
      has_source_with_m_moles = source_aliquot_compound.m_moles.present?
      transferred_moles = nil
      source_batches = source_aliquot_compound.batches

      has_source_solubility_flag = !source_aliquot_compound.solubility_flag.nil?

      if has_source_with_m_moles
        case type
        when :solid
          unless @current_mass_by_aliquot[from_aliquot].nil? or @current_mass_by_aliquot[from_aliquot] == 0
            from_aliquot_total_mass = @current_mass_by_aliquot[from_aliquot]
            transferred_moles = source_aliquot_compound.m_moles * amount / (from_aliquot_total_mass * 1000)
            source_m_moles = source_aliquot_compound.m_moles - transferred_moles
            source_aliquot_compound.update!(m_moles: source_m_moles)
            @current_mass_by_aliquot[from_aliquot] -= amount
          end
        when :liquid
          unless @current_volume_by_aliquot[from_aliquot].nil? or @current_volume_by_aliquot[from_aliquot] == 0
            source_total_volume = @current_volume_by_aliquot[from_aliquot]
            transferred_moles = source_aliquot_compound.m_moles * amount / source_total_volume
            source_m_moles = source_aliquot_compound.m_moles - transferred_moles
            source_aliquot_compound.update!(m_moles: source_m_moles)
            @current_volume_by_aliquot[from_aliquot] -= amount
          end
        end
      end

      if is_shared_compound
        shared_compound_m_moles = dest_shared_aliquot_compound.m_moles
        has_shared_compound_with_m_moles = shared_compound_m_moles.present?
        has_shared_compound_with_no_solubility_flag = dest_shared_aliquot_compound.solubility_flag.nil?
        dest_batches = dest_shared_aliquot_compound.batches
        batches_propagated = source_batches - dest_batches
        dest_shared_aliquot_compound.batches << batches_propagated

        if has_shared_compound_with_m_moles && has_source_with_m_moles
          dest_m_moles = transferred_moles + shared_compound_m_moles
          dest_shared_aliquot_compound.update!(m_moles: dest_m_moles)
        else
          dest_shared_aliquot_compound.update!(m_moles: nil)
        end

        if has_source_solubility_flag && has_shared_compound_with_no_solubility_flag
          dest_shared_aliquot_compound.update!(solubility_flag: source_aliquot_compound.solubility_flag)
        end

      else
        aliquot_compound_link = AliquotCompoundLink.create(
          aliquot_id: to_aliquot["id"],
          compound_link_id: source_aliquot_compound.compound_link_id,
          m_moles: transferred_moles,
          solubility_flag: source_aliquot_compound.solubility_flag
        )
        aliquot_compound_link.batches = source_batches
      end
    end
  end

  def destroy_all_internal(objs)
    objs.each(&:destroy)
  end

  def update_compositions
    aliquots_by_id = {}
    @transfers.each do |transfer|
      from = transfer[:from]
      to   = transfer[:to]

      aliquots_by_id[from.id] = from
      aliquots_by_id[to.id]   = to
    end

    # FOR RESOURCES -> mapping from aliquot_id to resource_ids
    aliquot_id_to_resource_ids_map = AliquotResourceLink.where(aliquot_id: aliquots_by_id.keys)
                                                        .group_by(&:aliquot_id)
                                                        .transform_values { |aclinks| aclinks.map(&:resource_id) }

    # FOR RESOURCES -> mapping from aliquot_id to resource_ids additions
    resource_additions = {}

    @transfers.each do |transfer|
      from           = transfer[:from]
      to             = transfer[:to]
      type = transfer[:type]
      amount             = transfer[:amount]
      ## If `from` and `to` are the same then there is no need of resource and compound propagation.
      next if from == to or amount.nil?

      update_compound_amounts(from, to, type, amount)

      from_resource_ids = aliquot_id_to_resource_ids_map[from.id] || []
      to_resource_ids   = aliquot_id_to_resource_ids_map[to.id] || []
      to_resource_additions = resource_additions[to.id] || []

      from_resource_ids.each do |resource_id|
        to_resource_ids << resource_id
        to_resource_additions << resource_id
      end

      aliquot_id_to_resource_ids_map[to.id] = to_resource_ids
      resource_additions[to.id] = to_resource_additions
    end

    resource_additions.each do |aliquot_id, resourceids|
      aliquot = aliquots_by_id[aliquot_id]
      aliquot.add_resource_by_id(resourceids.uniq)
    end
  end

  def record_effect(aliquot_effect)
    aliquot_effect.id = AliquotEffect.generate_snowflake_id
    aliquot_effect.created_at = @recorded_at
    aliquot_effect.generating_instruction = @instruction

    save_later(aliquot_effect)

    aliquot_effect
  end
end
