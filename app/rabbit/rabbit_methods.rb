require "#{Rails.root}/app/managers/execution_manager"

class RabbitMethods
  DSL = Autoprotocol::Schema::DSL
  def initialize()
    @volume_schema = DSL.build do
      Volume()
    end
  end

  def ping(_params)
    { ok: true, answer: 42 }.as_json
  end

  # Make a json object use indifferent access if possible
  #
  # @param params any valid json object
  def apply_indifferent_access(params)
    if params.is_a?(Hash)
      params = params.with_indifferent_access
    end
    params
  end

  # Notify that a Warp has been updated from a workcell.
  #
  # @param params
  #
  # @option params [Hash] :warp The Warp
  #  * @option :warp [String] runId
  #  * @option :warp [String] deviceId
  #  * @option :warp [String] instructionId
  #
  # @option params [Hash] :time_estimate  Estimated duration of the warp { :nominal, :min, :max }
  #  * @option :time_estimate [String] :nominal Time with unit
  #  * @option :time_estimate [String] :min Time with unit
  #  * @option :time_estimate [String] :max Time with unit
  #
  # @option params [Boolean] :instruction_complete boolean
  # @option params [Array] :warp_events Array of WarpEvent
  def systemnode_update_warp(params)
    warp_id = params[:warp][:id]

    # Get run_id from run execution
    run_ex_id     = RunExecution.extract_execution_id(params[:warp][:runId])
    run_execution = RunExecution.find_by(id: run_ex_id)

    # Sometimes TCLE will submit things directly to TCLE that the webapp doesn't
    # know about, thus no run execution.
    run_id = run_execution.try(:run_id)
    if run_execution && run_execution.started_at.nil?
      # TCLE does not tell us the start time of a warp, so we use the first
      # recieved warp to approximate start time. We subtract 10s as 'wiggle room' to
      # account for latency.
      #
      # Also, there are edge cases where humans complete the run manually, which sets the completed_at
      # field, and can cause weird timing issues where started_at is later than completed_at.
      # We solve that here as well.
      now = Time.now
      started_at   = now - 10
      completed_at = run_execution.completed_at ? now : nil

      run_execution.update(started_at: started_at, completed_at: completed_at)
    end

    # update runId to be actual run, not the execution id.
    params[:warp][:runId] = run_id

    if warp_id
      warp_attrs                  = params[:warp].except(:id).slice(*Warp.attribute_names)
      warp_attrs[:device_id]      = params[:warp][:deviceId]
      warp_attrs[:run_id]         = params[:warp][:runId]
      warp_attrs[:instruction_id] = params[:warp][:instructionId]
      warp_attrs.merge! params.slice(:reported_started_at, :reported_completed_at)

      if params[:time_estimate]
        warp_attrs[:nominal_duration] = postgres_interval params[:time_estimate][:nominal]
        warp_attrs[:min_duration]     = postgres_interval params[:time_estimate][:min]
        warp_attrs[:max_duration]     = postgres_interval params[:time_estimate][:max]
      end

      warp = Warp.find_by_id(warp_id)
      if warp.nil?
        warp    = Warp.new
        warp.id = warp_id
      end

      warp.update!(warp_attrs)
      if warp.state == 'Completed'
        warp.complete!
        should_complete_instruction = params[:instruction_complete] && warp.instruction_id

        if should_complete_instruction
          instruction = Instruction.find(warp.instruction_id)

          # NOTE: It would be nice to know which human/operator completed the warp, but that
          # isn't currently possible.
          instruction.completed_by_human = true if warp.device_id =~ /human/

          # IMPORTANT must first run complete_execute_instruction to activate exeuction manager,
          # Then process warp events which requires execution manager having already been completed
          # Finally clean up reservation which completes a run execution, which assumes liquid sensing
          # warp events have already been processed
          instruction.complete_execute_instruction(true)
        end

        # IMPORTANT must complete warp before processing warp events, processing of
        # warp events such as liquid sensing assumes prior warp/instruction execution
        process_warp_events(params[:warp_events], warp_attrs[:instruction_id]) if params[:warp_events]

        if should_complete_instruction
          instruction.clean_up_reservation
        end
      end

      WarpEvent.create!(warp_id: warp.id, warp_state: warp.state)
    end

    do_container_transfers(params[:container_transfers])
  rescue StandardError => e
    run_ex_id = RunExecution.extract_execution_id(params[:warp][:runId])

    Rails.logger.info("Error with #{run_ex_id}: #{e.message}")

    if Rails.env.production? or Rails.env.staging?
      incident_id = "ex1#{SNOWFLAKE.next.to_base31}"
      Bugsnag.notify(e, {
        incident_id: incident_id,
        severity: 'error',
        note: "Warp update did not occur. ",
        warp_id: warp_id,
        run_ex_id: run_ex_id
      })
    end
  end

  # Fetch a container
  #
  # @param [Hash] params
  # @option params [ContainerId] container_id
  # @return [Container]
  # @raise [ArgumentError]
  def systemnode_describe_container(params)
    container_id = params[:container_id]
    container = Container.find_by_id(container_id)
    raise(ArgumentError, "Container #{container_id} could not be found") if container.nil?

    container.as_json(Container.flat_json)
  end

  # Fetch containers json
  #
  # @param [Hash] params
  # @option params [Array[ContainerId]] containerIds
  # @return [Array[Container]] containers json
  # @raise ArgumentError
  def systemnode_describe_containers(params)
    container_ids = params[:containerIds]
    containers = Container.with_deleted.order(:id).where(id: container_ids).to_a

    found_ids   = containers.map(&:id).to_set
    missing_ids = container_ids.reject { |id| found_ids.include?(id) }

    if !missing_ids.empty?
      raise(ArgumentError, "Containers #{missing_ids} could not be found")
    end

    containers.as_json(Container.flat_json)
  end

  # Update container barcodes
  # @param [Map(ContainerId, Barcode)] params
  # @return Map(ContainerId, Res)
  #
  # @example
  #   Updating a container with a barcode not currently in use
  #   #> systemnode_update_barcodes({"ct122" => "12345678"})
  #   #> {"ct122" => "Success"}
  #
  # @example
  #   Updating a container with a barcode that is already in use
  #   #> systemnode_update_barcodes({"ct122" => "12345678"})
  #   #> {"ct122" => "Error"}
  def systemnode_update_barcodes(params)
    response = params.map { |container_id, data|
      barcode = data['barcode']
      container = Container.with_deleted.find_by_id(container_id)
      if container.nil?
        [ container_id, 'Error' ]
      else
        message = container.update(barcode: barcode) ? 'Success' : 'Error'
        # check for malformed request
        if (!data['well_idx'] && data['parent_barcode']) || (data['well_idx'] && !data['parent_barcode'])
          message = 'Error'
        # realize request for lcms container
        elsif container.container_type_shortname == 'single-vbottom-microwell' && message == 'Success' &&
              data['well_idx'] && data['parent_barcode']
          message = realize_lcms_container(container_id, data['parent_barcode'], data['well_idx'])
        end
        [ container.id, message ]
      end
    }.to_h

    response.as_json
  end

  def realize_lcms_container(container_id, parent_barcode, well_idx)
    lcms_plate = Container.with_deleted.find_by(barcode: parent_barcode, lab: Current.lab.shared_ccs_labs)
    if lcms_plate.nil?
      lcms_plate_type = ContainerType.find('96-vbottom-microwell')
      lab = Container.find(container_id).lab

      # TODO: add more information for the container
      lcms_plate = Container.new(container_type: lcms_plate_type, barcode: parent_barcode, lab: lab)
      lcms_plate.save!
    end
    existing_aliquot = Aliquot.where(container_id: lcms_plate.id, well_idx: well_idx)
    if existing_aliquot.empty?
      a = Aliquot.new(
        container_id: lcms_plate.id,
        well_idx: well_idx,
        properties: {
          container_id: container_id
        }.as_json
      )
      a.save!
    else
      return 'Error'
    end
    return 'Success'
  end

  # Fetch container ids from barcodes
  #
  # @param params Json object with key `barcodes` which points to array of all_barcodes
  # @return hash from all input barcodes to the container id for the barcode, or nil
  def system_node_container_ids_for_barcodes(params)
    barcodes = params[:barcodes]
    if barcodes.length > 1000
      message = "Max request size is 1000 but requested #{barcodes.length}"
      return { success: false, message: message }.as_json
    end

    all_barcodes = barcodes.map { |b| [ b, nil ] }.to_h
    active_barcodes = Container.where(barcode: barcodes, lab: Current.lab.shared_ccs_labs)
                               .map { |c| [ c.barcode, c.id ] }
                               .to_h
    all_barcodes.merge(active_barcodes).as_json
  end

  # {
  #   // Querying
  #
  #   // Optional. Return only warps which were executing at some time during the given
  #   // time period. If a warp started before the final timestamp provided, but ended
  #   // afterwards, it will still be returned.
  #   "duration": {
  #     // Optional. Warps that completed before this time will be excluded.
  #     "start": iso8601,
  #     // Optional. Warps that started after this time will be excluded.
  #     "end": iso8601
  #   },
  #
  #   // Optional. Restrict query to warps on the given device.
  #   "device_id": string,
  #
  #   // Optional. Restrict query to warps with the given command name.
  #   "command_name": string,
  #
  #   // Pagination
  #
  #   // Maximum number of warps to return. Must be between 1 and 5000.
  #   // Default: 1000
  #   "limit": int,
  #   // Optional. Restricts the query to return only warps with an ID greater than this.
  #   // Useful for pagination -- pass the last ID from the previous page to get
  #   // the next page.
  #   "starting_after": string,
  # }
  #
  # Returns:
  #
  # {
  #   // True if there are more warps matching the query than are included in the
  #   // "results" field. Use the "starting_after" field to get the next page if
  #   // this is true.
  #   "has_more": bool,
  #   // Warps matching the query.
  #   "results": [ warp ]
  # }
  def systemnode_get_warps(params)
    limit = (params[:limit] || 100).to_i
    unless (1..100).cover? limit
      raise(ArgumentError, "limit must be between 1 and 100")
    end

    query = Warp.all.order('id ASC')
    # Add one to the limit so we can tell if there's more to get or not.
    query = query.limit(limit + 1)
    if params[:starting_after]
      query = query.where('id > ?', params[:starting_after])
    end
    if params[:during]
      early = params[:during][:start]
      late = params[:during][:end]
      if early
        query = query.where('reported_completed_at >= ?::timestamptz', early)
      end
      if late
        query = query.where('reported_started_at <= ?::timestamptz', late)
      end
    end
    if params[:device_id]
      query = query.where(device_id: params[:device_id])
    end
    if params[:command_name]
      query = query.where("command->>'name' = ?", params[:command_name])
    end
    warps = query.to_a
    {
      has_more: warps.size > limit,
      # double as_json to make timestamps be ISO-8601
      results: warps[0...limit].as_json.as_json
    }
  end

  # Called when a container needs to be stored in a particular storage environment, like
  # when an instruction completes.
  def systemnode_location_for_destiny(params)
    container_id      = params[:container_id]
    storage_condition = params[:storage_condition]

    if !container_id || !storage_condition
      raise(ArgumentError, "Must provide container_id and storage_condition")
    end

    if storage_condition == 'ambient'
      raise(ArgumentError, "There is no long term storage at the storage_condition 'ambient'.")
    end

    container = Container.find(container_id)

    current_location_valid =
      if container.location
        LocationService.errors_for_location_validation(container_id).empty?
      else
        false
      end

      picked_location = LocationService.pick_location_for_container(container_id, true, storage_condition)

    # The location picking algorithm currently does not factor in the container's current location
    # So if the only valid place for a container is the location that it currently occupies, the algo will return nil.
    # In this case, we just keep the location of the container the same (as long as the location is valid).
    best_location =
      if picked_location
        picked_location
      else
        if !current_location_valid
          raise("Couldn't find a location for container #{container_id}.")
        end

        container.location
      end

    best_location.as_json(Location.short_json)
  end

  def systemnode_placed_container(params)
    response = {}
    params.each { |param|
      param = param.with_indifferent_access
      container_id = param[:container_id]
      location_id  = param[:location_id]
      device_id    = param[:device_id]

      response[container_id] = {
        success: true
      }

      # TODO: might want errors specific to failures at looking up provided device id
      device = device_id ? Device.find_by(id: device_id) : nil

      begin
        if container_id.nil?
          raise(ArgumentError, "Must provide container_id")
        elsif location_id.nil? && (device.nil? || device.location_id.nil?)
          raise(ArgumentError, "Must provide location_id or device_id that is bound to a location")
        else
          # prefer an explicit location_id and then the device location_id
          location_id ||= device.try(:location_id)

          container, errors = LocationService.move(container_id, location_id)

          if errors.empty?
            storage_condition = Location.find(location_id).merged_properties['environment']
            container.update(storage_condition: storage_condition, location_id: location_id)
          else
            raise("Unable to place container #{container_id} in location #{location_id}")
          end
        end
      rescue StandardError => e
        response[container_id] = {
          success: false,
          message: e
        }
        Bugsnag.notify(e, severity: 'warning')
      end
    }
    return response.as_json
  end

  def systemnode_get_run(params)
    scle_run_id = params[:run_id]
    run_id, execution_id = RunExecution.extract_id_parts(scle_run_id)

    return { success: false, message: "Run id is required but was not provided" }.as_json unless run_id

    schedule_request = if execution_id.nil?
                         ScheduleRequest
                           .where(run_id: run_id, status: 'success')
                           .order(created_at: :desc)
                           .first
                       else
                         ScheduleRequest
                           .where(run_id: run_id)
                           .where("request#>>'{run,run_id}' = ?", scle_run_id)
                           .first
                       end

    if schedule_request.nil?
      return { success: false,
               message: "Schedule request with run_id #{run_id.inspect} could not be found"
      }.as_json
    end

    { success: true, run: schedule_request.request["run"] }.as_json
  end

  def systemnode_notify_run_cleared(params)
    run_ex_id = RunExecution.extract_execution_id(params[:runId])

    execution = RunExecution.find_by(id: run_ex_id)
    raise(ArgumentError, "Run #{run_ex_id.inspect} could not be found") if execution.nil?

    ReservationManager.clear_run_execution(run_ex_id)
  end

  # Currently this is called by TCLE when a PendingSchedule is cleared,
  # so in these cases we should end up clearing all of the instructions of an execution.
  #
  # To be future proof, we handle instruction clears where some are missing.
  def systemnode_notify_instructions_cleared(params)
    run_ex_id       = RunExecution.extract_execution_id(params[:runId])
    instruction_ids = params[:instructionIds]

    execution = RunExecution.find_by(id: run_ex_id)
    raise(ArgumentError, "Run #{run_ex_id.inspect} could not be found") if execution.nil?

    missing_ids = execution.instruction_ids - instruction_ids

    if missing_ids.empty?
      ReservationManager.clear_run_execution(run_ex_id)
    else
      # update execution to just have the missing ids
      execution.instrution_ids = missing_ids
      execution.save

      # remove reservations.
      instruction_ids.each do |instruction_id|
        ReservationManager.clear_instruction(instruction_id)
      end
    end
  end

  def systemnode_notify_world_state_cleared(params)
    # Workcell ids from TCLE will be in this random sortment
    #   ["wc4-mcx1", "wc3", "haven-wetlab1"]
    #
    #   We need to find those that start with wc and assume that they match our devices.
    workcell_ids = params[:workcellIds]

    sanitized_ids = workcell_ids.select { |id|
      id.starts_with?('wc')
    }.map { |id| id.split('-').first }

    sanitized_ids.each do |workcell_id|
      ReservationManager.complete_workcell(workcell_id)
    end
  end

  # This is a short term hack to allow for us to use existing containers as new refs.
  # At l2s2 we need to create tared vials but then reference them as if they were `new`.
  # To get around this, tcle will select one of these tared vials to be used as the new ref
  # in the run and then notify us here. We then have to transfer over a few properties
  # from this container onto the unrealized container from the ref (eg the barcode, tared_weight, etc)
  #
  # @param barcode_container_map Barcode to container id mapping. Container id is the id of the ref'd container
  def systemnode_override_tared_properties(barcode_container_map)
    begin
      # Compute changes
      errors, changes = compute_override_tared_properties(barcode_container_map)

      if !errors.empty?
        Rails.logger.error("Found errors in systemnode_override_tared_properties: #{errors}")
        return { success: false, message: "Invalid barcode mapping provided: #{errors.to_json}" }.as_json
      end

      ActiveRecord::Base.transaction do
        changes[:containers_to_destroy].map(&:destroy!)
        changes[:containers_to_save].map(&:save!)
        changes[:aliquots_to_save].map(&:save!)
      end

      return { success: true }.as_json
    rescue => e
      Rails.logger.error("Failed to update database in systemnode_override_tared_properties: #{e}")
      return { success: false, message: "Failed to update database: #{e.message}" }.as_json
    end
  end

  # Create a generated container for an instruction
  #
  # @param params [Hash] the parameters sent over rabbit
  # @option params [String] :name The name of the container to create
  # @option params [String] :instructionId The instruction id of the instruction generated the container
  # @option params [ContainerType] :containerType The type of the container created
  # @option params [String] :cover The cover state of the container. nil if uncovered
  # @option params [String] :barcode The optional barcode of the plate
  # @option params [Hash]   :aliquots The optional initial aliquots properties for some wells in this plate
  # @return [Hash] A JSON payload with the container id of the container created
  def systemnode_generate_container(params)
    instruction = Instruction.find_by_id(params[:instructionId])
    raise(StandardError, "Instruction #{params[:instructionId]} does not exist") if instruction.nil?

    org = instruction.organization
    container_type = ContainerType.find(params[:containerType])
    raise(StandardError, "Container type #{params[:containerType]} does not exist") if container_type.nil?

    name = params[:name]
    cover = params[:cover]
    # optional arguments
    barcode = params[:barcode]
    aliquots = params[:aliquots] || {}

    Container.transaction do
      container = Container.new(
        container_type: container_type,
        organization: org,
        label: name,
        barcode: barcode,
        cover: cover,
        lab: instruction.run.lab
      )
      container_saved = container.save
      unless container_saved
        messages = container.errors.full_messages.join(", ")
        raise(StandardError, "Could not save the container: #{messages}")
      end

      context = ExecutionContext.new(instruction.refs)

      aliquots.each do |idx, prop|
        volume = prop[:volume]
        container_id_source = prop[:containerId]
        well_idx_src = prop[:wellIdx]

        parsed_volume = @volume_schema.parse(volume)
        well_idx = Integer(idx)
        aliquot = container.aliquots.build(well_idx: well_idx)

        aliquot_source = Aliquot.find_by(container_id: container_id_source, well_idx: well_idx_src)
        raise(StandardError, "Could not find aliquot: #{container_id_source}/#{well_idx_src}") if aliquot_source.nil?

        context.move_liquid_by_aliquot(aliquot_source, aliquot, parsed_volume.value)
      end

      context.persist_all

      container_saved = container.save
      raise(StandardError, "Could not save the container aliquots") unless container_saved

      instruction.generated_container_links.build(container: container)
      instruction_saved = instruction.save
      unless instruction_saved
        messages = instruction.errors.full_messages.join(", ")
        raise(StandardError, "Could not link the container with the instruction: #{messages}")
      end

      # Everything went well
      {
        containerId: container.id
      }.as_json
    end
  rescue StandardError => e
    {
      error: e.message
    }.as_json
  end

  private

  def do_container_transfers(container_transfers)
    (container_transfers || {}).each do |container_id, destination|
      c = Container.find_by_id(container_id)
      next if c.nil?

      if destination
        LocationService.put_in_device container_id, destination[:device_id], destination[:slot]
      else
        LocationService.remove_from_device container_id
      end
    end
  end

  # Helper method to systemnode_override_tared_properties
  def compute_override_tared_properties(barcode_container_map)
    valid_container_types = [ 'a1-vial', 'd2-vial' ]
    errors_by_barcode = {}

    # persist in this order so new containers can use barcodes of destroyed ones
    containers_to_destroy = []
    containers_to_save = []
    aliquots_to_save = []

    barcode_container_map.each do |barcode, ref_container_id|
      #
      # Start with validation
      #
      # The container currently on the system which has the tared_weight
      # TODO: need to pass the lab_ids for ccs orgs
      existing_container = Container.find_by(barcode: barcode, deleted_at: nil, lab: Current.lab.shared_ccs_labs)
      if existing_container.nil?
        errors_by_barcode[barcode] = "Specified container was not found with barcode: #{barcode}"
        next
      end
      # the placeholder container associated to the ref of a run
      new_container = Container.find_by_id(ref_container_id)
      if new_container.nil?
        errors_by_barcode[barcode] = "Specified container was not found: #{ref_container_id}"
        next
      end

      if !valid_container_types.include?(new_container.container_type_id)
        errors_by_barcode[barcode] = "Container must be one of #{valid_container_types.join(', ')}"
        next
      end

      if !existing_container.has_same_container_type?(new_container)
        errors_by_barcode[barcode] = "Provided a container type different from the new container."
        next
      end

      if existing_container.id == new_container.id
        next
      end

      existing_aliquot = existing_container.aliquots.where(well_idx: 0).first
      # TODO: uncomment below post 2020 Q1 SAT as this is a temporary workaround
      # if existing_aliquot.properties['tared_weight'].nil?
      #   errors_by_barcode[barcode] = "Aliquot did not have a property of 'tared_weight'"
      #   next
      # end

      # Now compute the effects
      aliquots_with_props = new_container.aliquots.find_or_initialize_by(well_idx: 0)
      if existing_aliquot.nil?
        aliquots_with_props.mass_mg = existing_container.aliquot_mass_mg
        # aliquots_with_props.volume_ul is 0 by default.
      else
        aliquots_with_props.mass_mg = existing_aliquot.mass_mg
        aliquots_with_props.volume_ul = existing_aliquot.volume_ul
        aliquots_with_props.properties = existing_aliquot.properties
      end

      aliquots_to_save << aliquots_with_props
      containers_to_destroy << existing_container

      new_container.empty_mass_mg = existing_container.empty_mass_mg
      new_container.current_mass_mg = existing_container.current_mass_mg
      new_container.lab_id = existing_container.lab_id
      new_container.barcode = barcode
      containers_to_save << new_container
    end

    return [
      errors_by_barcode,
      {
        aliquots_to_save: aliquots_to_save,
        containers_to_destroy: containers_to_destroy,
        containers_to_save: containers_to_save
      }
    ]
  end

  # TODO: make this feature more generic?
  # For example, the tecan omni event give information about specific transfert.
  # This is not simple to do that for modules, e.g. SMR5.
  def process_warp_events(warp_events, instruction_id)
    # Handle tecan omni events
    tecanomni_liquid_sensing_events = warp_events.select { |event| event['name'] == 'TecanOmniLLDWarpEvent' }
    if tecanomni_liquid_sensing_events.present?
      process_tecanomni_liquid_sensing_events(tecanomni_liquid_sensing_events, instruction_id)
    end

    # Handle SMR5 events
    smr5_liquid_sensing_events = warp_events.select { |event| event['name'] == 'Smr5ComputedVolumeWarpEvent' }
    if smr5_liquid_sensing_events.present?
      process_smr5_liquid_sensing_events(smr5_liquid_sensing_events, instruction_id)
    end
  end

  def process_tecanomni_liquid_sensing_events(liquid_sensing_events, instruction_id)
    location_grouped_events = liquid_sensing_events.group_by { |event| event[:locationIndex] }
    # Note: We're currently only persisting the last flagged liquid sensing event per location. We may want to consider
    # persisting all liquid sensing events in the future (not just flagged ones)

    location_grouped_events.each do |_location_idx, group|
      filtered_events = group.select do |event|
        event['flaggedTransfer']
      end
      latest_event = filtered_events.max_by { |e| Time.parse(e[:timeStamp]) }

      if latest_event
        process_tecanomni_liquid_sensing_event(latest_event, instruction_id)
      end
    end
  end

  def process_tecanomni_liquid_sensing_event(event, instruction_id)
    instruction = Instruction.find_by_id(instruction_id)
    sensed_location = instruction.parsed.locations[event[:locationIndex].to_i]
    container_id = instruction.refs.find_by(name: sensed_location["location"]["container"]).container_id
    well_idx = sensed_location["location"]["well"].to_i
    aliquot = Aliquot.find_by(container_id: container_id, well_idx: well_idx)

    locations_to_process = instruction.parsed.locations.select.with_index do |location, i|
      next if i <= event[:locationIndex].to_i

      location['location']['container'] == sensed_location['location']['container']
    end

    total_remaining_volume_change =
      sum_volume_for_location(sensed_location, event[:transportIndex].to_i) +
      locations_to_process.inject(0) { |sum, location| sum + sum_volume_for_location(location) }
    # liquid sensing can happen prior to remaining transports on the same location without sensing
    # it also happens before the dispense/aspirate within the same transport, therefore
    # in order to calibrate the sensed volume, volume change from the remaining transports on the location
    # must be applied to the sensed volume.
    calibrated_sensed_volume = @volume_schema.parse(event["sensedVolume"]).value + total_remaining_volume_change
    sensing_method = event["detectionMethod"]
    flagged_transfer = event["flaggedTransfer"]

    manager = ExecutionManager.new(instruction.refs)
    manager.execute_liquid_sensing(
      instruction,
      aliquot,
      calibrated_sensed_volume,
      sensing_method,
      flagged_transfer,
      force = false
    )
  end

  def sum_volume_for_location(location, starting_transport_index = 0)
    location[:transports].each_with_index.cycle(location[:cycles] || 1).inject(0) do |sum, transport_with_idx|
      transport, index = transport_with_idx
      if transport[:mode_params][:liquid_class] == 'air' || index < starting_transport_index
        sum
      else
        sum + transport[:volume]
      end
    end
  end

  def process_smr5_liquid_sensing_events(liquid_sensing_events, instruction_id)
    instruction = Instruction.find_by_id(instruction_id)

    # Smr5ComputedVolumeWarpEvent
    # { "sensedVolume": <Volume>, "containerId": <ContainerId>, "wellIdx": <Int>, "timeStamp": <Time> }
    liquid_sensing_events.each do |event|
      container_id = event[:containerId]
      well_idx = event[:wellIdx]
      aliquot = Aliquot.find_by(container_id: container_id, well_idx: well_idx)

      if aliquot.nil?
        # this would indicate a bug, the event are changing an aliquots that was not created by the instruction.
        Rails.logger.error("Error with accessing aliquot #{container_id}/#{well_idx}")
      else
        parsed_volume = @volume_schema.parse(event[:sensedVolume])

        if parsed_volume.errors.empty?
          sensed_volume = parsed_volume.value
          manager = ExecutionManager.new(instruction.refs)
          manager.execute_liquid_sensing(
            instruction,
            aliquot,
            sensed_volume,
            "ReturnedByModule",
            flagged_transfer = true,
            force = true
          )
        else
          Rails.logger.error("Error volume is invalid: #{event[:sensedVolume]}, #{parsed_volume.errors}")
        end
      end
    end
  end

  def postgres_interval(time)
    if time.nil?
      nil
    else
      value, unit = time.split(/:/)
      value = value.to_f
      case unit
      when 'microsecond'
        value /= (1000.0 * 1000.0)
      when 'millisecond'
        value /= 1000.0
      when 'second'
        # :+1:
      when 'minute'
        value *= 60
      when 'hour'
        value *= 3600
      when 'day'
        value *= (3600 * 24)
      else
        raise "Unknown unit: #{unit}"
      end

      ActiveSupport::Duration.build(value)
    end
  end
end
