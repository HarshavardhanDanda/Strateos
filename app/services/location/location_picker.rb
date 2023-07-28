#
# Determines the optimal location for a given container. The strategy will first narrow down the
# options by hard requirements, and then will optimize the choice by several other factors,
# listed below.
#
# Hard requirements
#   - The storage condition of the location must match the desired_environment
#   - The location must accept containers of this type
#   - The location has enough capacity for the container
#
# Optimization goals
#   - Cluster with containers from the same run
#   - Cluster with containers from the same organization
#   - Pick locations with the most space.  We want to "spread out" containers like this
#     because it leaves flexibility for storing containers in the future.  If we just shoved
#     all containers as close together as possible, we would end up clustering different orgs together.
#
# Returns a Location if a suitable location was found, otherwise nil
#
module LocationPicker
  extend self

  def pick(container_id, is_admin, desired_environment)
    container   = Container.find(container_id)
    environment = desired_environment || container.storage_condition || 'ambient'

    if environment.nil?
      raise ArgumentError, "Cannot pick location for container #{container.id} with unknown storage conditions"
    end

    # Disallow placing zymo vendor tubes.
    # We still allow placing zymo buffers for example.
    if container.container_type_id == 'vendor-tube'
      zymo_resource_ids = Resource.where("name ilike '%zymo%'").pluck(:id)
      resource_id       = container.aliquots.first.try(:resource_id)
      is_zymo_tube      = zymo_resource_ids.include?(resource_id)

      if is_zymo_tube
        raise ArgumentError, "Cannot pick location for container #{container_id} "\
                             "becuase it is a Zymo tube. Create a new location for Zymo tubes."
      end
    end

    location_id = nil

    ActiveRecord::Base.connection.cache do
      available = available_locations(container, is_admin, environment)
      location_id =
        if available.count > 0
          optimal_location_for_container(container, available)
        else
          nil
        end
    end

    if location_id.nil?
      return nil
    end

    location = Location.find_by(id: location_id)
    if location && location.location_type.box?
      Location.where(parent_id: location_id).unoccupied.first
    else
      location
    end
  end

  def optimal_location_for_container(container, location_ids)
    # Pick among the locations based on the optimizational goals. This is a fairly simple approach. Each feature
    # has a function which computes a number between [0, 1] where 0 is the lowest match for the feature, and 1 is
    # the highest. We also weight the feature by a multiplier, and then sum the features. The location with the
    # highest total score will be selected. Weights can be tuned based on feedback from ops.
    weights_by_feature =
      # Containers without an organization are stock containers. These are clustered by resource.
      if container.organization.nil?
        {
          feature_same_resource: 2,
          feature_spacious: 1
        }
      # Otherwise they are customer samples
      else
        {
          feature_same_run: 4,
          feature_same_org: 2,
          feature_spacious: 1
        }
      end

    location_scores = {}
    weights_by_feature.keys.each do |feature|
      location_scores[feature] = self.send(feature, container, location_ids)
    end

    location_ids.max_by do |location_id|
      location_scores.sum do |(feature, location_score)|
        # if location_id is not in the feature's returned hash, assume lowest (0) score
        (location_score[location_id] || 0) * weights_by_feature[feature]
      end
    end

  end

  RACK_CELL_WIGGLE_ROOM = 10

  def find_valid_locations(container, is_admin, environment)
    long_term_storage_name = :plate_rack_cell
    long_term_storage_name = :tube_cell if container.container_type.is_tube?

    locations = if is_admin
                  Location.joins(:location_type)
                          .where(location_types: { name: long_term_storage_name })
                          .where("merged_properties -> 'environment' = '#{environment}'")
                else
                  Location.joins(:location_type)
                          .where(location_types: { name: long_term_storage_name })
                          .where("merged_properties -> 'environment' = '#{environment}'")
                          .where(lab_id: container.lab_id)
                end

    if container.location
      location = container.location.root || container.location
      if location.is_region?
        locations = locations.where("'#{location.id}' = ANY (parent_path)")
      end
    end

    return filter_compatible_locations(container, locations)
  end

  def filter_compatible_locations(container, locations)
    hazards = container.hazards

    # filter out locations which contain the hazards
    if !hazards.empty?
      # get id of locations which contain blacklist hazards
      location_ids = locations.where("blacklist && ARRAY[?]::varchar[]", hazards).pluck(:id)
      # filter out locations which contain the location as parent_path and
      # locations which contain blacklist hazards
      if !location_ids.empty?
        locations = locations
          .where.not("parent_path && ARRAY[?]::varchar[]", location_ids)
          .where.not("id = ANY(ARRAY[?])", location_ids)
      end
    end

    return locations
  end

  def available_locations(container, is_admin, environment)
    valid_locations = find_valid_locations(container, is_admin, environment)

    # available valid locations
    if container.container_type.is_tube?
      # all boxes with at least one unoccupied valid location
      valid_locations.unoccupied.pluck('DISTINCT(parent_id)')
    else
      usable_height       = "locations.height_mm - #{RACK_CELL_WIGGLE_ROOM}"
      available_height_mm = "(#{usable_height}) - COALESCE( SUM(container_types.height_mm), 0 ) > ?"

      # all plate rack cells with enough space to fit the container being placed
      valid_locations
        .includes(containers: :container_type)
        .group(:id)
        .having(
          available_height_mm,
          container.container_type.height_mm
        )
        .pluck(:id)
    end
  end

  def location_column_for_container(container)
    # If we are placing a tube, then we are placing into a box, otherwise, a plate
    # rack cell. To check all containers in a box, we check locations who's parent_id
    # is the box (tube cells). For plate racks, the container's location id will be
    # the plate rack cell.
    container.container_type.is_tube? ? :parent_id : :id
  end

  # A hash mapping the total number of containers for each location_id in location_ids
  def number_of_containers_in_location(location_ids, location_column)
    Location
      .where(location_column => location_ids)
      .includes(:containers)
      .group(location_column)
      .pluck(location_column, 'COUNT(containers.id)')
      .to_h
  end

  # Helper function that transforms a hash mapping location to a count of containers
  # to a hash mapping location to the ratio of container count / total containers
  # for the location
  def percent_by_location(scores, container, location_ids)
    location_column  = location_column_for_container(container)
    total_containers = number_of_containers_in_location(location_ids, location_column)

    total_containers.each_with_object({}) do |(location_id, count), acc|
      acc[location_id] =
        if scores.include?(location_id) && count > 0
          scores[location_id].to_f / count
        else
          0
        end
    end
  end

  #
  # The features below score a location for a container between 0 and 1 based on how suited
  # the container is for the location, by this feature
  #
  def feature_same_org(container, location_ids)
    location_column = location_column_for_container(container)

    same_organization = Location.where(location_column => location_ids)
                                .joins(:containers)
                                .where(containers: { organization_id: container.organization_id })
                                .where.not(containers: { organization_id: nil })
                                .group(location_column)
                                .pluck(location_column, 'COUNT(containers.id)')
                                .to_h

    percent_by_location(same_organization, container, location_ids)
  end

  # Prefer locations which have containers who have shared a run. Note that this is checking for
  # containers who have ever shared a run. If we want to break ties, we could add another feature
  # which checks for container who shared the same *last* run.
  def feature_same_run(container, location_ids)
    location_column = location_column_for_container(container)

    same_run = Location.where(location_column => location_ids)
                       .joins(containers: :refs)
                       .where(refs: { run_id: container.refs.select(:run_id) })
                       .group(location_column)
                       .pluck(location_column, Arel.sql('COUNT( DISTINCT(containers.id) )'))
                       .to_h

    percent_by_location(same_run, container, location_ids)
  end

  # The percent of space in the location as a function of it's total space
  def feature_spacious(container, location_ids)
    if container.container_type.is_tube?
      Location
        .where(parent_id: location_ids)
        .includes(:containers)
        .group(:parent_id)
        .pluck(
          :parent_id,
          Arel.sql('1 - CAST(COUNT(containers.id) AS FLOAT) / COUNT( DISTINCT(locations.id) )')
        )
        .to_h
    else
      Location
        .where(id: location_ids)
        .includes(containers: :container_type)
        .group(:id)
        .pluck(
          :id,
          Arel.sql('1 - COALESCE( SUM(container_types.height_mm), 0 ) / locations.height_mm')
        )
        .to_h
    end

  end

  # Prefer containers that have a shared resource. Note that this checks if there are
  # ANY shared resources.
  def feature_same_resource(container, location_ids)
    location_column = container.container_type.is_tube? ? :parent_id : :id

    same_resource = Location.where(location_column => location_ids)
                            .joins(containers: :aliquots)
                            .where.not(aliquots: { resource_id: nil })
                            .where(aliquots: { resource_id: container.aliquots.map(&:resource_id) })
                            .group(location_column)
                            .pluck(location_column, Arel.sql('COUNT( DISTINCT(container_id) )'))
                            .to_h

    percent_by_location(same_resource, container, location_ids)
  end

end
