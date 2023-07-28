module ReservationManager
  #
  # This module has private methods that won't be
  # copied into the module itself.  Extending self will though.
  # If we had instead `include ReservationManager` in some class then
  # the module_function would work.
  extend self

  def complete_instruction(id)
    inst = Instruction.find(id)

    # delete tiso reservations for completed instruction
    TisoReservation.where(instruction_id: id).destroy_all

    RunExecution.active_by_run(inst.run_id).each do |run_ex|
      if run_ex.should_complete?
        ReservationManager.complete_run_execution(run_ex.id)
      end
    end
  end

  def clear_instruction(id)
    TisoReservation.where(instruction_id: id).destroy_all
  end

  def clear_run_execution(id)
    RunExecution.active.where(id: id).update(cleared_at: Time.now)
    TisoReservation.where(run_execution_id: id).destroy_all

    if !id
      return Bugsnag.notify(
        "RunExecution ID should not be nil",
        severity: 'warning',
        run_execution_id: id
      )
    end
  end

  def complete_run_execution(id)
    RunExecution.active.where(id: id).update(completed_at: Time.now)
    TisoReservation.where(run_execution_id: id).destroy_all

    if !id
      return Bugsnag.notify(
        "RunExecution ID should not be nil",
        severity: 'warning',
        run_execution_id: id
      )
    end
    # This can be called while in a transaction and this job needs the RunExecution's
    # completed_at time. So we schedule the job to run later when the transaction
    # has completed. The transaction could potentially rollback, but the job is
    # effectively idempotent.
    RunExecutionVideoJob.perform_in(5.minutes, id)
    SlackMessageForFlaggedTransfersJob.perform_async(id)
  end

  def complete_run(run_id)
    ids = RunExecution.active.where(run_id: run_id).pluck(:id)

    ids.each { |id| ReservationManager.complete_run_execution(id) }
  end

  def complete_workcell(workcell_id)
    ids = RunExecution.active
                      .where("workcell_id ilike ?", "#{workcell_id}%")
                      .pluck(:id)

    ids.each { |id| ReservationManager.complete_run_execution(id) }
  end

  def reserve_tisos(run_execution, refs, instructions, workcell, user, organization, reserve_destinies: false)
    # errors when creating tiso reservations
    errors = []
    results = nil

    # Fail early if workcell doesn't exist
    return [ {}, errors ] if workcell.nil?

    # Note[crc] Rails controller tests do not usually directly test methods on a controller.
    # Because our tests do (via hacks), setting the isolation level is problematic.
    isolation = Rails.env.test? ? {} : { isolation: :serializable }

    ActiveRecord::Base.transaction(**isolation) do
      # Stores the state of the world with regards to slots
      slot_group = create_slot_group(workcell, user, organization)

      refs.each do |ref|
        # For every condition:
        #   - nil: ignore
        #   - impossible to satisfy: ignore
        #   - possible, but can't make reservation:
        #     - ignore if start/destiny.
        #     - error if instruction
        #   - possible, create reservation, sometimes choosing the same slot/container pair if possible.
        self.all_conditions(ref, instructions, reserve_destinies).each do |id, condition|
          container = ref.container

          next if condition.nil?
          next if slot_group.impossible_to_satisfy?(container, condition)

          # Find a previous used slot for this container searching both container position and tiso reservations.
          # OR Find the best availabe slot
          slot = slot_group.find_reusable(container, condition) ||
                 slot_group.find_best_available(container, condition)

          if slot.nil?
            if [ "start", "dest" ].include?(id)
              # ignore start/dest conditions if we can't make them.
            else
              errors << "Could not create a TisoReservation for REF: #{ref.name} at #{condition}"
            end

            next
          end

          # The all_conditions method returns a hash where the keys are either instruction_ids or [start, dest].
          #  Confusing, yes, but helps to have all conditions in one data structure.
          instruction_id = [ "start", "dest" ].include?(id) ? nil : id

          res = TisoReservation.new(run_execution_id: run_execution.id,
                                    run_id: run_execution.run_id,
                                    instruction_id: instruction_id,
                                    container_id: container.id,
                                    device_id: slot.device_id,
                                    slot: { col: slot.col, row: slot.row })

          slot.add_reservation(res)
        end
      end

      if errors.empty?
        # fetch reservation information in TCLE format
        results = slot_group.convert_for_tcle()

        # save all new reservations.
        reservations = slot_group.unsaved_reservations
        reservations.map(&:save!)
      end
    end
    # TCLE format map container_id -> [{condition, device_id, slot}]
    [ results, errors ]
  end

  def fake_reservations(refs, instructions, device_set)
    reservations = {}
    tisos        = device_set.select { |_, desc| desc[:class][:name] == 'tiso' }

    refs.each do |ref|
      container  = ref.container
      conditions = self.all_conditions(ref, instructions, false)

      conditions.each do |_id, condition|
        next if condition.nil?

        device_id, _desc = tisos.find { |_, desc| desc[:class][:condition] == condition['where'] }

        reservations[container.id] ||= []
        reservations[container.id] << {
          condition: condition,
          device_id: device_id,
          slot: { col: 0, row: 0 }
        }.as_json
      end
    end

    # TCLE format map container_id -> [{condition, device_id, slot}]
    reservations.as_json
  end

  # Creates a map from instruction_id/start/dest -> condition
  def all_conditions(ref, instructions, reserve_destinies)
    container = ref.container
    incubates = instructions.select { |inst| inst.op == 'incubate' && inst.operation['object'] == ref.name }

    # InstructionId -> Condition, where instructionId can be "destiny" "starting".
    # Makes it easier for iteration to have everything in one data structure
    all_conditions = {}

    if reserve_destinies
      all_conditions['start'] = container_to_condition(container)

      # reserve destination if there is a specific store location
      all_conditions['dest'] =
        if ref.can_reserve_destiny
          {
            'where' => ref.destiny.dig('store', 'where'),
            'shaking' => ref.destiny.dig('store', 'shaking'),
            'co2_percent' => 0.0 # for now ref's store doesn't specify co2_percent, so we default to 0
          }
        end
    end

    incubates.each do |inst|
      all_conditions[inst.id] = {
        'where' => inst.operation['where'],
        'shaking' => inst.operation['shaking'],
        'co2_percent' => (inst.operation['co2_percent'] || 0.0).to_f
      }
    end

    all_conditions
  end

  # Creates a SlotGroup, which holds information on all tiso columns and rows and
  # their availability and requirements.
  def create_slot_group(workcell, user, organization)
    tiso_slots = tiso_columns_in_workcell(workcell).flat_map do |tc|
      # We fetch the device by tiso columns -> parent location's -> name
      parent_location = Location.find(tc.parent_id)
      device_id = get_device_id_by_name(user, organization, parent_location.name)

      # If the device ID is Nil after fetching device from AMS with it's name, we fetch the device in web
      # to see if the device is present in web DB and not in AMS.
      if device_id.nil?
        device = device_for_tiso_column(tc)

        if device.nil?
          Rails.logger.info("Couldn't find matching device for tiso column #{tc.name}")
          next
        end

        device_id = device.id
      end

      container_type_ids = tc.acceptable_container_types

      (0...tc.location_type.capacity).map do |row|
        condition = tiso_column_to_condition(tc)

        Slot.new(device_id, tc.position, row, condition, container_type_ids)
      end
    end

    # HACK: arbitrarily model versos like a tiso that is 10 column by 1000 row
    verso_slots = versos_in_workcell(workcell).flat_map do |verso|
      # We fetch the device by tiso columns -> parent location's -> name
      parent_location = Location.find(verso.parent_id)
      device_id = get_device_id_by_name(user, organization, parent_location.name)

      # If the device ID is Nil after fetching device from AMS with it's name, we fetch the device in web
      # to see if the device is present in web DB and not in AMS.
      if device_id.nil?
        device = device_for_verso(verso)

        if device.nil?
          Rails.logger.info("Couldn't find matching device for verso #{verso.name}")
          next
        end

        device_id = device.id
      end

      # for now allow all container types
      container_type_ids = ContainerType.pluck(:id)

      slots = []

      (0...10).each do |column|
        (0...1000).each do |row|
          condition = verso_to_condition(verso)

          slots << Slot.new(device_id, column, row, condition, container_type_ids)
        end
      end

      slots
    end

    slot_group = SlotGroup.new(tiso_slots + verso_slots)

    # Add tiso reservations
    TisoReservation.all_within(workcell).each { |res| slot_group.add_reservation(res) }

    # Add containers that are already in tisos
    Container.find_tiso_containers_within(workcell).each do |c|
      tiso_col = c.location
      # We fetch the device by tiso columns -> parent location's -> name
      parent_location = Location.find(tiso_col.parent_id)
      device_id = get_device_id_by_name(user, organization, parent_location.name)

      # If the device ID is Nil after fetching device from AMS with it's name, we fetch the device in web
      # to see if the device is present in web DB and not in AMS.
      if device_id.nil?
        device = device_for_tiso_column(tiso_col)

        if !device.nil?
          device_id = device.id
        end
      end

      slot_group.add_container(c.id, device_id, tiso_col.position, c.slot["row"])
    end

    # Add containers that are already in versos
    Container.find_verso_containers_within(workcell).each do |c|
      verso = c.location
      # We fetch the device by tiso columns -> parent location's -> name
      parent_location = Location.find(verso.parent_id)
      device_id = get_device_id_by_name(user, organization, parent_location.name)

      # If the device ID is Nil after fetching device from AMS with it's name, we fetch the device in web
      # to see if the device is present in web DB and not in AMS.
      if device_id.nil?
        device = device_for_verso(verso)

        if !device.nil?
          device_id = device.id
        end
      end

      # TCLE doesn't update web with the slot information
      # so we choose a random position.
      slot = verso_slots.find { |s| s.available && s.device_id == device_id }

      slot_group.add_container(c.id, device_id, slot.col, slot.row)
    end

    slot_group
  end

  def tiso_column_to_condition(tiso_column)
    mprops = tiso_column.merged_properties

    {
      # TODO: use json for properties so that shaking and co2_percent can be a boolean
      'where' => mprops['environment'],
      'shaking' => (mprops['shaking'] == 'true'),
      'co2_percent' => (mprops['co2_percent'] || '0.0').to_f
    }
  end

  def verso_to_condition(verso)
    mprops = verso.merged_properties

    {
      # TODO: use json for properties so that shaking and co2_percent can be a boolean
      'where' => mprops['environment'],
      'shaking' => false,
      'co2_percent' => 0.0
    }
  end

  def container_to_condition(container)
    return nil if container.nil?

    # within a tiso
    device = container.find_device_using_location

    if device.nil?
      return nil
    end

    if device.device_class == "tiso"
      return tiso_column_to_condition(container.location)
    end

    if device.device_class == 'verso'
      return verso_to_condition(container.location)
    end

    return nil
  end

  def tiso_columns_in_workcell(workcell)
    Location.where_location_category('tiso_column')
            .where("? = any (locations.parent_path)", workcell.id)
  end

  def versos_in_workcell(workcell)
    Location.where_location_type_by_name('verso')
            .where("? = any (locations.parent_path)", workcell.id)
  end

  def device_for_tiso_column(tiso_column)
    Device.find_by(location: tiso_column.parent_id)
  end

  def device_for_verso(verso)
    Device.find_by(location: verso.id)
  end

  # Represents a Slot within a tiso column and stores all of the necessary information to
  # aid in searching for usable/available slots.
  class Slot
    attr_reader :device_id, :col, :row, :condition, :container_type_ids, :container_id, :reservations

    def initialize(device_id, col, row, condition, container_type_ids)
      @device_id          = device_id
      @col                = col
      @row                = row
      @condition          = condition
      @container_type_ids = container_type_ids
      @reservations       = []
      @container_id       = nil
    end

    def available
      @reservations.empty? && @container_id.nil?
    end

    def add_reservation(reservation)
      @reservations << reservation
    end

    def add_container(container_id)
      @container_id = container_id
    end

    def unsaved_reservations
      @reservations.select(&:new_record?)
    end

    def allows(container_type_id)
      @container_type_ids.include?(container_type_id)
    end

    def is_deep?
      @container_type_ids.include?('96-deep')
    end
  end

  class SlotGroup
    attr_reader :slots

    # Helps compute relatively fast:
    #  - If the container+condition combo is already satisfied
    #  - Slots with a given condition.
    def initialize(slots)
      @slots              = []

      # a mapping from condition to slots
      # This is somewhat dangerous because condition equality and hash existence act funny.
      #
      # For example this is true
      #   {co2_percent: 0} == {co2_percent: 0.0}
      #
      # But storing the first example and using the second as a key will fail since for some
      # weird reason the hash values are different.
      @condition_to_slots = {}

      slots.each { |slot| add_slot(slot) }
    end

    def add_slot(slot)
      @slots << slot

      # add slot to condition
      temp = @condition_to_slots[slot.condition] || []
      temp << slot
      @condition_to_slots[slot.condition] = temp
    end

    def add_reservation(res)
      found = @slots.find do |slot|
        slot.device_id == res.device_id &&
          slot.col == res.slot["col"] &&
          slot.row == res.slot["row"]
      end

      found&.add_reservation(res)
    end

    def add_container(container_id, device_id, col, row)
      found = @slots.find do |slot|
        slot.device_id == device_id &&
          slot.col == col &&
          slot.row == row
      end

      found&.add_container(container_id)
    end

    # Search for any slot with the condition and that supports the container type
    def impossible_to_satisfy?(container, condition)
      ctype = container.container_type_id

      filter_by_ctype_cond(ctype, condition).empty?
    end

    # Find slot that already has the container or a reservation at the given condition
    def find_reusable(container, condition)
      ctype = container.container_type_id
      slots = filter_by_ctype_cond(ctype, condition)

      # find slot by container_id or reservation.
      slots.find do |slot|
        slot.container_id == container.id ||
          slot.reservations.find { |res| res.container_id == container.id }
      end
    end

    def find_available(container, condition)
      ctype = container.container_type_id

      filter_by_ctype_cond(ctype, condition)
        .select(&:available)
    end

    def find_best_available(container, condition)
      slots = find_available(container, condition)

      # 1. prefer short columns if available
      # 2. prefer most accessible
      sorted = slots.sort_by do |slot|
        is_deep = slot.is_deep? ? 1 : -1

        # sort_by can sort by multiple attributes
        [ is_deep, slot.col, -slot.row ]
      end

      sorted.first
    end

    def filter_by_ctype_cond(ctype, condition)
      slots = @condition_to_slots[condition]

      return [] if slots.nil?

      slots.select { |slot| slot.allows(ctype) }
    end

    def unsaved_reservations
      @slots.flat_map(&:unsaved_reservations)
    end

    # Find all unsaved reservations and create a container_id -> [{condition, device_id, slot}, ...]
    def convert_for_tcle
      results = {}

      @slots.each do |slot|
        slot.unsaved_reservations.each do |res|
          # Since we create a reservation for instruction and since instructions might share
          # the same Slot we must dedeplicate these as TCLE expects one.
          results[res.container_id] ||= Set.new

          results[res.container_id] << {
            condition: slot.condition,
            device_id: slot.device_id,
            slot: { col: slot.col, row: slot.row }
          }
        end
      end

      # dedupe by converting to arrays
      results.map { |k, v| [ k, v.to_a ] }.to_h.as_json
    end
  end

  private

  def get_device_id_by_name(user, organization, device_name)
    if device_name.nil?
      return nil
    else
      ams_device_response = ASSET_MANAGEMENT_SERVICE.devices(user, organization, device_name)
      if ams_device_response.content.present?
        return ams_device_response.content[0]&.name
      end
    end
  end
end
