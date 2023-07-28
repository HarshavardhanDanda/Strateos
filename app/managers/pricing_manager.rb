module PricingManager
  module_function

  CHARGE_DECIMAL_PLACES = 3 # millidollars
  SALES_TAX_MULTIPLIER = 1.09
  DEFAULT_PROFIT_MARGIN = 0.10

  class PriceTree
    include ActiveModel::Serializers::JSON
    attr_reader :children
    attr_accessor :name

    def initialize(name, children)
      @name = name
      @children = children
    end

    def total
      @children.sum(&:total).round(CHARGE_DECIMAL_PLACES).to_d
    end

    def flatten
      @children.flat_map(&:flatten)
    end

    def serializable_hash(_opts = {})
      {
        name: @name,
        total: total,
        children: @children
      }.as_json
    end
  end

  class PriceNode
    include ActiveModel::Serializers::JSON
    attr_reader :name, :run_credit_applicable, :taxable, :bsl_sensitive
    attr_accessor :cost

    def initialize(name, cost, run_credit_applicable: true, taxable: true, bsl_sensitive: true)
      @name                  = name
      @cost                  = cost.round(CHARGE_DECIMAL_PLACES).to_d
      @run_credit_applicable = run_credit_applicable
      @taxable               = taxable
      @bsl_sensitive         = bsl_sensitive
    end

    def flatten
      [ self ]
    end

    def total
      @cost
    end

    def serializable_hash(_opts = {})
      {
        name: name,
        total: total,
        run_credit_applicable: run_credit_applicable,
        taxable: taxable
      }.as_json
    end
  end

  def apply_bsl2_pricing(price_tree)
    price_tree.name = "#{price_tree.name} (BSL2)"

    price_tree
      .flatten
      .select { |node| node.is_a?(PriceNode) && node.bsl_sensitive }
      .each { |node| node.cost = node.cost * 2 }

    price_tree
  end

  def price_for_run(run)
    instructions_price = price_for_instructions run

    # calculating pricing for provision and dispense resources requires that we
    # reduce over all dispense resource instructions.
    # It is quite likely that two separate instructions will use the same resource.
    provision_instructions = run.instructions.select { |ins|
      ins.op == 'provision'
    }.map(&:parsed)

    dispense_instructions = run.instructions.select { |ins|
      ins.op == 'dispense' && ins.op
    }.map(&:parsed)

    children = [
      price_for_refs(run.refs),
      price_for_orderable_materials(run.required_orderable_materials),
      price_for_provisions(provision_instructions),
      price_for_dispenses(dispense_instructions, run.refs),
      instructions_price
    ].reject do |tree|
      tree.is_a?(PriceTree) and tree.children.empty?
    end

    price_tree = PriceTree.new "Total", children

    if run.bsl2?
      apply_bsl2_pricing(price_tree)
    end

    price_tree
  end

  def price_for_instructions(run)
    instruction_price_trees = run.instructions.each_with_index.map do |ins, seq_no|
      name = "Instruction #{seq_no}: #{ins.op}"
      children =
        if Rails.env.test? and ins.operation.include? 'x_price'
          [ PriceNode.new("Test price", ins.operation['x_price']) ]
        else
          [ price_for_instruction(ins.parsed, run) ].compact
        end

      PriceTree.new name, children
    end

    # TODO: warps without an instruction id associated are lost.
    PriceTree.new "Instructions", instruction_price_trees
  end

  def price_for_instruction(instruction, run)
    case instruction
    when Autoprotocol::Cover
      lid_price = PricingInfo['lidding']['lid_types'][instruction.lid]
      lid_markup = 1.19
      cover_instruction_price = PricingInfo['lidding']['per_instruction']
      PriceTree.new(
        "Lidding",
        [
          PriceNode.new("Lidding Device Time", cover_instruction_price),
          PriceNode.new(
            "#{instruction.lid.capitalize} Lid Cost",
            lid_price * lid_markup,
            run_credit_applicable: false
          )
        ]
      )

    when Autoprotocol::Uncover
      PriceNode.new(
        "Delidding Device Time",
        PricingInfo['lidding']['per_instruction']
      )

    when Autoprotocol::Absorbance
      num_flashes = instruction.wells.size * (instruction.num_flashes || 25)
      raw_duration_hrs = TimeUtil.seconds_to_hours(instruction.raw_duration_sec)
      PriceNode.new(
        "Spectrophotometry (absorbance)",
        num_flashes * PricingInfo['spectrophotometry']['absorbance']['per_flash'] +
          PricingInfo['spectrophotometry']['absorbance']['base'] +
          raw_duration_hrs * PricingInfo['spectrophotometry']['absorbance']['per_hour']
      )

    when Autoprotocol::Fluorescence
      num_flashes = instruction.wells.size * (instruction.num_flashes || 25)
      raw_duration_hrs = TimeUtil.seconds_to_hours(instruction.raw_duration_sec)
      PriceNode.new(
        "Spectrophotometry (fluorescence)",
        num_flashes * PricingInfo['spectrophotometry']['fluorescence']['per_flash'] +
          PricingInfo['spectrophotometry']['fluorescence']['base'] +
          raw_duration_hrs * PricingInfo['spectrophotometry']['fluorescence']['per_hour']
      )

    when Autoprotocol::Luminescence
      num_wells = instruction.wells.size
      raw_duration_hrs = TimeUtil.seconds_to_hours(instruction.raw_duration_sec)
      PriceNode.new(
        "Spectrophotometry (luminescence)",
        num_wells * PricingInfo['spectrophotometry']['luminescence']['per_well'] +
          PricingInfo['spectrophotometry']['luminescence']['base'] +
          raw_duration_hrs * PricingInfo['spectrophotometry']['luminescence']['per_hour']
      )

    when Autoprotocol::LCMRM
      num_wells = instruction.wells.size
      PriceNode.new(
        "LCMRM",
        num_wells * PricingInfo['lcmrm']['per_injection'] +
          PricingInfo['lcmrm']['base']
      )

    when Autoprotocol::LCMS
      PriceNode.new("SPE", PricingInfo['spe']['per_instruction'])

    when Autoprotocol::Spectrophotometry
      abs_price = instruction.luminescence_wells.size * PricingInfo['spectrophotometry']['absorbance']['per_flash']
      flu_price = instruction.luminescence_wells.size * PricingInfo['spectrophotometry']['fluorescence']['per_flash']
      lum_price = instruction.luminescence_wells.size * PricingInfo['spectrophotometry']['luminescence']['per_well']

      total = abs_price + flu_price + lum_price

      # multiply by number of intervals
      total = instruction.num_intervals * total

      if abs_price > 0
        total += PricingInfo['spectrophotometry']['absorbance']['base']
      end

      if flu_price > 0
        total += PricingInfo['spectrophotometry']['fluorescence']['base']
      end

      if lum_price > 0
        total += PricingInfo['spectrophotometry']['luminescence']['base']
      end

      PriceNode.new("Spectrophotometry", total)

    when Autoprotocol::Dispense
      # for resources that refer to a resource_id we calculate pricing by finding
      # usable kits and kit_items, just like provision.
      return nil if instruction.db_based_resource?

      container_type  = run.refs.find { |ref| ref.name == instruction.object }.container_type
      total_volume_ul = instruction.total_volume(container_type)

      volume_cost = total_volume_ul * PricingInfo['dispense']['per_microliter']
      shaking_cost =
        if instruction.shake_after
          duration_seconds = instruction.shake_after[:duration].to_f
          duration_seconds * PricingInfo['dispense']['per_shaking_second']
        else
          0
        end
      PriceNode.new(
        "Reagent Dispenser",
        volume_cost + shaking_cost + PricingInfo['dispense']['base']
      )

    when Autoprotocol::Thermocycle
      raw_duration_hrs = TimeUtil.seconds_to_hours(instruction.raw_duration_sec)

      per_hour =
        if instruction.quantitative?
          PricingInfo['thermocycler']['qpcr']['per_hour']
        else
          PricingInfo['thermocycler']['pcr']['per_hour']
        end

      PriceNode.new("Thermocycling", raw_duration_hrs * per_hour)

    when Autoprotocol::Pipette
      PriceTree.new(
        "Liquid Handling",
        [
          PriceNode.new(
            "Disposable Tips",
            instruction.groups.size * PricingInfo['liha']['per_tip'],
            run_credit_applicable: false
          ),
          PriceNode.new(
            "Pipetting",
            PricingInfo['liha']['per_transfer'] * instruction.transfers.size +
              TimeUtil.seconds_to_hours(instruction.est_mix_time_sec) * PricingInfo['liha']['per_mix_hour']
          )
        ]
      )

    when Autoprotocol::Stamp
      PriceTree.new(
        "Stamping",
        [
          PriceNode.new(
            "Disposable Tips",
            instruction.num_tips_used * PricingInfo['stamper']['per_tip'],
            run_credit_applicable: false
          ),
          PriceNode.new(
            "Stamping Device Time",
            [ 0, PricingInfo['stamper']['base'] +
              instruction.total_volume_ul * PricingInfo['stamper']['per_microliter'] ].max
          )
        ]
      )

    when Autoprotocol::Seal
      PriceNode.new("Sealing", PricingInfo['sealer']['per_instruction'])

    when Autoprotocol::Unseal
      PriceNode.new("Desealing", PricingInfo['desealer']['per_instruction'])

    when Autoprotocol::Incubate
      duration_sec = instruction.duration # seconds
      total_hrs = TimeUtil.seconds_to_hours(duration_sec.to_f)

      price_per_hour = PricingInfo['tiso']['per_platehour']
      price_per_hour += PricingInfo['tiso']['co2_extra'] if instruction.co2_percent > 0

      PriceNode.new("Incubation Time", total_hrs * price_per_hour)

    when Autoprotocol::Maxiprep
      num_preps = instruction.groups.size
      total_price = (9.09 * (num_preps**-0.2) + PricingInfo['maxiprep']['per_aliquot']) * num_preps
      PriceNode.new(
        "Maxiprep Device Time",
        total_price
      )

    when Autoprotocol::Miniprep
      num_samples = instruction.groups.size
      num_groups = (num_samples.to_f / PricingInfo['miniprep']['group_size']).floor
      remaining_samples = num_samples % PricingInfo['miniprep']['group_size']
      group_cost =
        PricingInfo['miniprep']['base_cost'] * (PricingInfo['miniprep']['group_size']**-0.5) *
        PricingInfo['miniprep']['group_size'] * num_groups
      if remaining_samples > 0
        remaining_cost = PricingInfo['miniprep']['base_cost'] * (remaining_samples**-0.5) * remaining_samples
      else
        remaining_cost = 0
      end
      total_cost = group_cost + remaining_cost
      PriceNode.new(
        "Miniprep",
        total_cost
      )

    when Autoprotocol::GelSeparate
      matrix_cost = PricingInfo['gel']['matrix'][instruction.matrix]
      ladder_cost = PricingInfo['gel']['ladder'][instruction.ladder]
      PriceTree.new(
        "Gel Separation",
        [
          PriceNode.new("Matrix", matrix_cost, run_credit_applicable: false),
          PriceNode.new("Ladder", ladder_cost, run_credit_applicable: false)
        ]
      )
      # TODO: processing cost + running time cost

    when Autoprotocol::GelPurify
      matrix_cost = PricingInfo['gel']['matrix'][instruction.matrix] * (instruction.objects.size / 8.0).ceil
      ladder_cost = PricingInfo['gel']['ladder'][instruction.ladder]
      extraction_cost = PricingInfo['gel']['per_extraction'] * instruction.extract.size

      PriceTree.new(
        "Gel Purify",
        [
          PriceNode.new("Matrix", matrix_cost, run_credit_applicable: false, bsl_sensitive: false),
          PriceNode.new("Ladder", ladder_cost, run_credit_applicable: false, bsl_sensitive: false),
          PriceNode.new("Extraction", extraction_cost, run_credit_applicable: false, bsl_sensitive: false)
        ]
      )

    when Autoprotocol::Envision
      PriceNode.new("Envision", PricingInfo['envision']['total'])

    when Autoprotocol::Spread
      PriceNode.new(
        "Spread",
        PricingInfo['spread']['per_spread']
      )

    when Autoprotocol::Autopick
      PriceNode.new(
        "Autopick",
        PricingInfo['autopick']['per_pick'] * instruction.dest_wells.size
      )

    when Autoprotocol::SangerSequence
      PriceNode.new(
        "Sanger Sequence (#{instruction.type})",
        PricingInfo['sanger_sequence'][instruction.type]['per_sample'] * instruction.wells.size,
        run_credit_applicable: false, bsl_sensitive: false
      )

    when Autoprotocol::FlowAnalyze
      PriceNode.new(
        "Flow Analyze",
        PricingInfo['flow_analyze']['per_sample'] * instruction.samples.size
      )

    when Autoprotocol::FlowCytometry
      PriceNode.new(
        "Flow Cytometry",
        PricingInfo['flow_cytometry']['per_sample'] * instruction.samples.size
      )

    when Autoprotocol::Oligosynthesize
      PriceTree.new(
        "Oligosynthesis",
        instruction.oligos.map do |o|
          PriceNode.new(
            "#{o[:sequence].size}bp, scale: #{o[:scale]}, pur: #{o[:purification]}",
            o[:sequence].size * PricingInfo['oligosynthesize']['per_base'][o[:scale]] +
              PricingInfo['oligosynthesize']['purification'][o[:purification]],
            run_credit_applicable: false, bsl_sensitive: false
          )
        end
      )

    when Autoprotocol::Provision
      # reagent value is calculated in price_for_provisions
      PriceTree.new(
        "Liquid Handling",
        [
          PriceNode.new(
            "Disposable Tips",
            instruction.to.size * PricingInfo['liha']['per_tip'],
            run_credit_applicable: false
          ),
          PriceNode.new(
            "Pipetting",
            PricingInfo['liha']['per_transfer'] * instruction.to.size
          )
        ]
      )

    when Autoprotocol::Spin
      duration_sec = instruction.duration
      total_hrs = TimeUtil.seconds_to_hours(duration_sec)
      centrifuge_price_per_hour = PricingInfo['centrifuge'][instruction.flow_direction]
      PriceNode.new(
        "Centrifuge Device Time",
        total_hrs * centrifuge_price_per_hour
      )

    when Autoprotocol::FlashFreeze
      PriceNode.new(
        "Flash Freeze",
        PricingInfo['flash_freeze']['per_each']
      )

    when Autoprotocol::AcousticTransfer
      PriceNode.new(
        "Acoustic Transfer",
        instruction.total_microliters * PricingInfo['acoustic_transfer']['per_microliter'] +
        instruction.groups.size * PricingInfo['acoustic_transfer']['per_group']
      )

    when Autoprotocol::Image
      PriceNode.new("Image", PricingInfo["image"]["per_instruction"])

    when Autoprotocol::ImagePlate
      PriceNode.new(
        "Image Plate",
        PricingInfo['image_plate']['per_instruction']
      )

    when Autoprotocol::MagneticTransfer
      groups_total_time = 0
      instruction.groups.each do |group|
        group.each do |subop_hash|
          # operations should have one field
          type, subop = subop_hash.first

          case type
          when "collect"
            collect_duration = subop[:pause_duration]
            collect_cycles = subop[:cycles]
            groups_total_time += collect_duration * collect_cycles
          else
            groups_total_time += subop[:duration]
          end
        end
      end

      kingfisher_price    = PricingInfo['magnetic_transfer']['kingfisher_per_hr']
      protector_tip_price = PricingInfo['magnetic_transfer']['per_protector_tip']

      PriceNode.new(
        "Magnetic Transfer",
        kingfisher_price / 3600 * groups_total_time + protector_tip_price * instruction.groups.size
      )

    when Autoprotocol::MeasureConcentration
      PriceNode.new("Measure Concentration",
                    PricingInfo['measure_concentration']['per_sample'] * instruction.object.size)

    when Autoprotocol::MeasureVolume
      PriceNode.new("Measure Volume", PricingInfo['measure_volume']['per_sample'] * instruction.object.size)

    when Autoprotocol::MeasureMass
      PriceNode.new("Measure Mass", PricingInfo['measure_mass']['per_sample'])

    when Autoprotocol::IlluminaLibraryPreparation
      source_price_info = PricingInfo['illumina_library_preparation']['source_price']
      per_source_price = source_price_info[instruction.experiment_type] || source_price_info['others']

      PriceNode.new("Illumina Library Preparation", per_source_price * instruction.sources.length)

    when Autoprotocol::IlluminaSequence
      num_lanes = instruction.lanes.length
      total_cycles = instruction.total_cycles
      pricing_info = PricingInfo['illumina_sequence'][instruction.sequencer][instruction.mode][instruction.flowcell]

      price = ((pricing_info['multiplier'] * total_cycles) + pricing_info['constant']) * num_lanes

      PriceNode.new("Illumina Sequence", price)

    when Autoprotocol::BlueWash
      PriceNode.new("BlueWash", PricingInfo[instruction.class::NAME]['per_instruction'])

    when Autoprotocol::LiquidHandle
      if instruction.num_tips_used > 1
        PriceTree.new(
          "Liquid Handling",
          [
            PriceNode.new(
              "Disposable Tips",
              instruction.num_tips_used * PricingInfo['stamper']['per_tip'],
              run_credit_applicable: false
            ),
            PriceNode.new(
              "Liquid Transfer Device Time",
              [ 0, PricingInfo['stamper']['base'] +
                instruction.total_volume_ul / 2 * PricingInfo['stamper']['per_microliter'] ].max
            )
          ]
        )
      else
        PriceTree.new(
          "Liquid Handling",
          [
            PriceNode.new(
              "Disposable Tips",
              instruction.num_tips_used * PricingInfo['liha']['per_tip'],
              run_credit_applicable: false
            ),
            PriceNode.new(
              "Pipetting",
              PricingInfo['liha']['per_transfer'] * instruction.transfer_size +
                TimeUtil.seconds_to_hours(instruction.est_mix_time_sec) * PricingInfo['liha']['per_mix_hour']
            )
          ]
        )
      end

    when Autoprotocol::MesoScaleSectorS600
      price_info = PricingInfo[instruction.class::NAME]
      PriceNode.new(
        "MesoScaleSectorS600",
        price_info['base'] + (instruction.raw_duration_hrs * price_info['per_hour'])
      )

    when Autoprotocol::CountCells
      PriceNode.new("CountCells", PricingInfo['count_cells']['per_instruction'])

    when Autoprotocol::Labchip
      PriceNode.new("Labchip", PricingInfo['labchip']['per_instruction'])

    when Autoprotocol::LCMS
      PriceNode.new("LCMS", instruction.num_injections * PricingInfo['lcms']['per_injection'])

    when Autoprotocol::Evaporate
      PriceNode.new("Evaporate", PricingInfo['evaporate']['per_instruction'])

    when Autoprotocol::Agitate
      PriceNode.new("Agitate", PricingInfo['agitate']['per_instruction'])

    when Autoprotocol::Sonicate
      PriceNode.new("Sonicate", PricingInfo['sonicate']['per_instruction'])

    else
      nil
    end
  end

  def price_for_provisions(insts)
    resource_to_volume = Hash.new { |hash, key| hash[key] = 0 }

    insts.each do |inst|
      resource_to_volume[inst.resource_id] += inst.total_volume
    end

    price_nodes = price_for_nodes_resources(resource_to_volume, provisionable: true)

    PriceTree.new("Provisioned Reagents", price_nodes)
  end

  def price_for_dispenses(insts, refs)
    resource_to_volume = Hash.new { |hash, key| hash[key] = 0 }

    insts.each do |inst|
      container_type = refs.find { |ref| ref.name == inst.object }.container_type
      resource_to_volume[inst.resource_id] += inst.total_volume(container_type)
    end

    price_nodes = price_for_nodes_resources(resource_to_volume, dispensable: true)

    PriceTree.new("Dispensed Reagents", price_nodes)
  end

  # Given a mapping from resource to required volume find the cheapest kit_items
  # globally and calculate the pricing tree.
  def price_for_nodes_resources(resource_to_volume, provisionable: false, dispensable: false)
    resource_ids = resource_to_volume.keys.to_set
    orderable_materials = OrderableMaterial.joins(orderable_material_components: :material_component)
                                           .where(orderable_material_components:
                                                    { material_components: { resource_id: resource_ids.to_a }})
                                           .where(orderable_material_components:
                                                    { provisionable: provisionable, dispensable: dispensable })
    # sort kits by:
    #  applicable resource size
    #  kit item size
    #  kit price
    orderable_materials_by_applicability = orderable_materials.sort do |om1, om2|
      size1 = om1.uniq_resources.select { |rid| resource_ids.include? rid }.size

      size2 = om2.uniq_resources.select { |rid| resource_ids.include? rid }.size

      if size1 != size2
        # sort by number of matched resources
        size1 <=> size2
      elsif om1.orderable_material_components.size != om2.orderable_material_components.size
        # prefer kits with fewer kit items
        om2.orderable_material_components.size <=> om1.orderable_material_components.size
      else
        # sort by cheapest kit
        om2.price <=> om1.price
      end
    end

    price_nodes = []
    remaining_resource_ids = resource_ids.clone

    # calculate the price by applying the most applicable kits
    until remaining_resource_ids.empty? or orderable_materials_by_applicability.empty?
      orderable_material = orderable_materials_by_applicability[-1]
      orderable_material_components = orderable_material.orderable_material_components
      resource_ids = orderable_material_components.map { |omc| omc.resource.id }.to_set

      resource_to_omc = {}
      resource_ids.each do |rid|
        # orderable_materials can have duplicate resources at varying volumes.
        # We keep the largest volume as that will make the volume ratio smaller
        # and thusly the total price less.
        resource_to_omc[rid] =
          orderable_material_components.select { |omc| omc.resource.id == rid }.sort_by(&:volume_per_container)[-1]
      end

      # calculate number of orderable_materials to purchase, can be non integer.
      orderable_material_count = resource_to_omc.values.map { |omc|
        volume =
          if remaining_resource_ids.include? omc.resource.id
            resource_to_volume[omc.resource.id]
          else
            0
          end

        # If the selected orderable_material does not have volume, set the volume to 1
        # This is a band-aid for not having solid-based provision price calculations
        # and avoid division by zero below.
        omc_volume_ul = omc.volume_per_container > 0 ? omc.volume_per_container : 1
        volume.to_f / (omc_volume_ul * omc.no_of_units)
      }.max

      if orderable_material_count > 0
        price_nodes << PriceNode.new(
          "#{orderable_material.material.name} (#{orderable_material.id}) x #{orderable_material_count}",
          sale_price_for_orderable_material(orderable_material) * orderable_material_count,
          run_credit_applicable: false, bsl_sensitive: false
        )
      end

      # remove processed resources
      remaining_resource_ids -= resource_ids
      orderable_materials_by_applicability.pop
    end

    price_nodes
  end

  def price_for_refs(refs)
    PriceTree.new "Containers", refs.map { |ref|
      if ref.is_new?
        PriceNode.new(
          "Ref '#{ref.name}' (#{ref.container_type.id})",
          ref.container_type.sale_price,
          run_credit_applicable: false
        )
      else
        nil
      end
    }.compact
  end

  def price_for_orderable_materials(orderable_materials)
    PriceTree.new(
      "Reserved Orderable materials",
      orderable_materials.map do |orderable_material_id, quantity, _refs|
        orderable_material = OrderableMaterial.find(orderable_material_id)
        PriceNode.new(
          "Reserve #{orderable_material.material.name} x #{quantity}",
          sale_price_for_orderable_material(orderable_material) * quantity,
          run_credit_applicable: false, bsl_sensitive: false
        )
      end
    )
  end

  def sale_price_for_orderable_material(orderable_material)
    profit_margin = orderable_material.margin || DEFAULT_PROFIT_MARGIN
    orderable_material.price * (SALES_TAX_MULTIPLIER + profit_margin)
  end
end
