require 'location_picker'
require 'position_util'

# This manages any changes that effect locations.  It shold be the sole
# place that we alter Locations, or the location of a container.
module LocationService
  extend self

  def move(container_id, location_id, position = nil)
    container     = Container.with_deleted.find(container_id)
    location      = Location.find(location_id)
    location_type = location.location_type

    # Find the appropriate device using both the location id and the parent location id.
    device = Device.find_by_location_id([ location.id, location.parent_id ].compact)
    slot   = { col: location.position, row: position } if location_type.tiso_column?

    validation_errors = errors_for_container_move(container_id, location_id, position)

    if not validation_errors.empty?
      return [ container, validation_errors ]
    end

    save_success = container.update(location: location,
                                               device: device,
                                               slot: slot)

    if not save_success
      return [ container, container.errors ]
    end

    [ container, [] ]
  end

  def pick_location_for_container(container_id, is_admin, desired_environment = nil)
    LocationPicker.pick(container_id, is_admin, desired_environment)
  end

  def create_location(location_json)
    permitted, error = location_create_params(location_json)

    if error
      return [ nil, [ error ] ]
    end

    location = Location.new(permitted)

    if location.save
      return [ location, [] ]
    else
      return [ nil, location.errors ]
    end
  end

  def create_box_location(location_json, rows, cols)
    box_params, error = location_create_params(location_json)
    if error
      return [ nil, [ error ] ]
    end

    max_length = 15
    if rows > max_length or cols > max_length
      return [ nil, [ "Number of rows or columns cannot exceed #{max_length}" ] ]
    end

    ActiveRecord::Base.transaction do
      box = Location.create!(box_params) # TODO: Use LocationService.create_location
      box_location_type = LocationType.find(box_params[:location_type_id])

      cell_type =
        if box_location_type.name == 'box96'
          LocationType.find_by_name('tube_cell_zymo')
        else
          LocationType.find_by_name('tube_cell')
        end

      rows.times do |row|
        cols.times do |col|
          Location.create(
            row: row,
            col: col,
            parent: box,
            location_type: cell_type,
            lab_id: box_params[:lab_id]
          )
        end
      end

      [ box, [] ]
    end
  rescue StandardError => e
    return [ nil, [ e.message ] ]
  end

  def create_rack_location(location_json, rows, cols, cell_height_mm)
    rack_params, error = location_create_params(location_json)
    if error
      return [ nil, [ error ] ]
    end

    max_length = 8
    if rows > max_length or cols > max_length
      return [ nil, [ "Number of rows or columns cannot exceed #{max_length}" ] ]
    end

    ActiveRecord::Base.transaction do
      rack      = Location.create!(rack_params) # TODO: Use LocationService.create_location
      rack_cell = LocationType.find_by_name('plate_rack_cell')

      rows.times do |row|
        cols.times do |col|
          Location.create(
            row: row,
            col: col,
            parent: rack,
            location_type: rack_cell,
            height_mm: cell_height_mm,
            lab_id: rack_params[:lab_id]
          )
        end
      end

      [ rack, [] ]
    end
  rescue StandardError => e
    return [ nil, [ e.message ] ]
  end

  def update_location(location_json, location_id)
    location = Location.find(location_id)
    location_json[:location][:lab_id] = location.lab_id if location_json[:location]
    permitted, error = location_update_params(location_json)
    if error
      return [ nil, [ error ] ]
    end

    if location.update(permitted)
      [ location, [] ]
    else
      [ nil, location.errors ]
    end
  end

  def destroy_location(location)
    undestroyable_location_categories = [ :workcell, :refrigerator ]

    if undestroyable_location_categories.include? location.location_type.category.to_sym
      raise UndestroyableLocationCategory, location
    elsif !location.containers_deep.empty?
      raise NonEmptyLocationError, location
    else
      location.destroy_deep!
    end
  end

  def next_available_locations(location_id, containers_count, black_listed = [])
    if containers_count <= 0
      return [ [], I18n.t("errors.messages.next_available_location.invalid_container_count") ]
    end

    location = Location.find_by(id: location_id)

    unless location
      return [ [], I18n.t("errors.messages.next_available_location.not_found", :location_id => location_id) ]
    end

    next_open_locations = []

    if location.location_type.tube_cell?
      box_id = location.parent_id
      children_locations = Location.where(parent_id: box_id)

      dimensions = box_dimensions(children_locations)

      current_position = PositionUtil.robot_from_coordinates(location.row, location.col, dimensions[:num_cols])
      non_empty_locations = Set.new(Container.where(location: children_locations)).pluck(:location_id)

      open_locations = children_locations.filter do |loc|
        !black_listed.include?(loc.id) && !non_empty_locations.include?(loc.id)
      end

      if open_locations.length < containers_count
        return [ [], I18n.t("errors.messages.next_available_location.not_enough_available_locations",
                            :containers_count => containers_count, :available_locations => open_locations.length) ]
      end

      sorted_open_locations = open_locations.sort_by { |l| PositionUtil.robot_from_coordinates(l.row, l.col,
        dimensions[:num_cols]) }

      next_open_locations = sorted_open_locations.pluck(:id)
      # We are iterating over sorted locations array and checking the position of locations
      sorted_open_locations.each do |loc|
        position = PositionUtil.robot_from_coordinates(loc.row, loc.col, dimensions[:num_cols])
        # If position is less than current position we are shifting array by one and updating the array
        # We ultimately slice and return the series of locations for our containers
        if position < current_position
          next_open_locations.push(next_open_locations.shift)
        end
      end
      return [ next_open_locations.slice(0, containers_count), nil ]
    else
      return [ [], I18n.t("errors.messages.next_available_location.invalid_location_type",
                          :location_type => location.location_type.category) ]
    end
  end

  def box_dimensions(locations)
    cell_with_max_row = locations.max_by(&:row)
    cell_with_max_col = locations.max_by(&:col)
    { num_rows: cell_with_max_row.row + 1, num_cols: cell_with_max_col.col + 1 }
  end

  def put_in_device(container_id, device_id, slot = nil)
    container = Container.find_by_id(container_id)
    device = Device.find_by_id(device_id)
    location_id = device ? device.location_id : nil

    # treat certain devices at trash and destroy the container
    # Should work with trash, wc6-disposal4, wl1-biohazardDisposal1
    if device_id =~ /^(trash|wc.*disposal.*)$/i
      trash_container container_id
    else
      # update the container's device attributes regardless of whether or not
      # the device exists.
      container.update(device_id: device_id, slot: slot, location_id: location_id)

      if device_id.present? && slot.present?
        move_to_tiso_column container, device_id, slot
      elsif container.location && container.location.location_type && container.location.location_type.tiso_column?
        # Delete slot when containers are being moved out of a tiso column
        container.update(slot: nil)
      end

      container.save
    end
  end

  # We eventually want to remove this functionality.  It only
  # exists now because TCLE will sometimes only tell us that
  # a container has been moved to a nil device_id.
  def remove_from_device(container_id)
    put_in_device container_id, nil
  end

  # Validates if a container is located in a valid location
  def errors_for_location_validation(container_id)
    container = Container.find(container_id)
    location  = container.location

    # We currently have the LocationTypes 'tiso' and 'tiso_column', but
    # strangely not a 'tiso_slot'.  Containers used to have a position field
    # which was used to designate the tiso row.  Now that this has been removed
    # we are using the container.slot["row"].
    #
    # TODO: Really we should be uniform in our Location modelling.  We should
    # remove slot on containers
    position = (container.slot || {})["row"]

    errors_for_container_location(container, location, position)
  end

  # Validates if a container can be moved to a location
  def errors_for_container_move(container_id, location_id, position = nil)
    container = Container.find(container_id)
    location  = Location.find_by(id: location_id)

    errors_for_container_location(container, location, position)
  end

  def errors_for_container_location(container, location, position = nil)
    unless location
      return { location: "A Location is required." }
    end

    errors = {}

    hazards = container.hazards
    blacklisted_hazards = location.blacklist
    has_hazards = hazards.any? { |hazard| blacklisted_hazards.include?(hazard) }
    if has_hazards
      errors[:hazards] = "This location is blacklisted for this container"
    end

    if location.location_type.tiso_column?
      message = error_for_tiso_capacity(location, position)
      if message then errors[:capacity] = message end
    # ensure only one container per tube cell
    elsif location.location_type.tube_cell?
      # if container is moving to occupied location or if location has more than 1 container
      if (container.location != location && location.containers.count > 0) ||
         (location.containers.count > 1)
        errors[:capacity] = "Multiple tubes cannot be in a single box cell."
      end
    end

    if !location_accepts_container_type(location, container)
      errors[:container_type] = "This location does not accept #{container.container_type_id}."
    end

    errors
  end

  # As our system becomes more robust we want to upgrade warnings into errors.
  # For now, `storage_condition` is not always strictly adhered to.  E.g. you can put a container into a tiso column
  # that does not have a matching temperature.
  def warnings_for_location_validation(container_id, location_id)
    unless location_id
      return { location: "Container does not have a location" }
    end

    location                   = Location.find(location_id)
    container                  = Container.find(container_id)
    location_storage_condition = location.merged_properties['environment']
    warnings                   = {}

    if container.storage_condition && container.storage_condition != location_storage_condition
      warnings[:storage_condition] = "This container specifies #{container.storage_condition}
                                       but it is located inside #{location_storage_condition}."
    end
    warnings
  end

  def location_search_params(location_json)
    validate_params(location_json, PERMITTED_LOCATION_PARAMS)
  end

  def in_tisos?(container)
    container.location && container.location.location_type.tiso_column?
  end

  private

  PERMITTED_LOCATION_PARAMS = [ :parent_id, :name, :position, :properties, :blacklist,
                               :location_type_id, :lab_id ].freeze

  PERMITTED_LOCATION_UPDATE_PARAMS = [ :parent_id, :name, :position, :blacklist, :properties ].freeze

  def validate_params(json, allowed = [], required = [])
    params    = ActionController::Parameters.new(json)
    l_params  = params.require(:location)
    required.each { |requirement| l_params.require(requirement) }

    permitted = l_params.permit(*allowed)
    if l_params.key? :properties
      # we need to read properties, as permit doesn't work for hash values.
      permitted[:properties] = l_params[:properties]
    end
    if l_params.key? :blacklist
      permitted[:blacklist] = l_params[:blacklist]
    end

    [ permitted.to_unsafe_h, nil ]
  rescue ActionController::ParameterMissing => e
    return [ nil, e ]
  end

  def validate_parent_location_lab(location_json)
    parent_id = location_json[:location][:parent_id]
    lab_id = location_json[:location][:lab_id]

    unless parent_id.nil?
      parent_lab_id = Location.find(parent_id).lab_id
      if parent_lab_id != lab_id
        return I18n.t("errors.attributes.parent_id.belongs_to_different_lab")
      end
    end
    return nil
  end

  def location_update_params(json)
    permitted, validation_errors = validate_params(json, PERMITTED_LOCATION_UPDATE_PARAMS)
    unless validation_errors.nil?
      return [ permitted, validation_errors ]
    end

    parent_location_error = validate_parent_location_lab(json)
    unless parent_location_error.nil?
      return [ nil, { "title": parent_location_error } ]
    end

    return [ permitted, nil ]
  end

  def location_create_params(json)
    permitted, validation_errors = validate_params(json, PERMITTED_LOCATION_PARAMS, [ :location_type_id ])
    unless validation_errors.nil?
      return [ permitted, validation_errors ]
    end

    parent_location_error = validate_parent_location_lab(json)
    unless parent_location_error.nil?
      return [ nil, { "title": parent_location_error } ]
    end

    return [ permitted, nil ]
  end

  def move_to_tiso_column(container, tiso_id, slot)
    tiso = Device.find_by(id: tiso_id)
    if tiso and tiso.location_id.present? and tiso.location.location_type.name == 'tiso'
      tiso_column = Location.where_location_category('tiso_column')
                            .find_by(parent_id: tiso.location_id,
                                     position: slot[:col])

      if tiso_column.present?
        move(container.id, tiso_column.id, slot[:row])
      end
    end
  end

  def error_for_tiso_capacity(location, position)
    capacity = location.location_type.try(:capacity)
    if capacity.present? and (position.nil? or !position.between?(0, capacity - 1))
      "Position Must be between 0 and #{capacity - 1}"
    end
  end

  def location_accepts_container_type(location, container)
    acceptable_types = location.acceptable_container_types
    !acceptable_types.nil? &&
      acceptable_types.include?(container.container_type_id)
  end

  # TODO: Create a new Location for trash instead of niling out location information.
  def trash_container(container_id)
    container = Container.find_by_id(container_id)
    container.update(
      device_id:   nil,
      slot:        nil,
      location_id: nil
    )

    # There is a race condition where both the save and destroy
    # searchkick reindex jobs try to fetch the container from the DB
    # and update elastic search.
    #
    # Even though the container is destroyed from the DB it sometimes
    # is not destroyed from elasticsearch. (Techincally, it is destroyed
    # from elasticsearch, but then is saved anew).
    #
    # This code forces that we only update elasticsearch once.
    Searchkick.callbacks(false) do
      container.save
      container.destroy # sets deleted_at for container and aliquots
    end

    container.reindex
  end

  class LocationServiceError < StandardError
  end

  class DestroyError < LocationServiceError
  end

  class UndestroyableLocationCategory < DestroyError
    def initialize(location)
      @id       = location.id
      @category = location.location_type.category
    end

    def message
      "Cannot destroy location #{@id} because it is a #{@category}"
    end
  end

  class NonEmptyLocationError < DestroyError
    def initialize(location)
      @id = location.id
    end

    def message
      "Cannot destroy location #{@id} because there are containers within it "\
        "or it's children"
    end
  end
end
