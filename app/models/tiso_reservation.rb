class TisoReservation < ApplicationRecord
  belongs_to :run, autosave: false
  belongs_to :device
  belongs_to :container, -> { with_deleted }
  belongs_to :lab

  validates_presence_of :run_id, :device_id, :slot, :container_id

  def self.all_within(location)
    if location.nil?
      return TisoReservation.none
    end

    TisoReservation.joins(device: :location)
                   .where("? = any (locations.parent_path)", location.id)
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def self.full_json
    {
      only: [ :id, :device_id, :run_execution_id, :run_id, :instruction_id,
             :container_id, :slot, :created_at, :updated_at ],
      methods: [],
      include: {
        device: {
          only: [ :id, :location_id ],
          include: [],
          method: []
        }
      }
    }
  end

  def self.run_payload(containers, destinies, title)
    run = {
      run_id: Run.generate_snowflake_id,
      title: title, # optional
      containertypes: {},
      refNames: {},
      containerData: {},
      destinies: destinies,
      reservations: {},
      instructions: [],
      provisionSources: {}
    }

    containers.each do |container|
      cid = container.id
      container_type = container.container_type
      run[:containertypes][container_type.shortname] = {
        name: container_type.name,
        shortname: container_type.shortname,
        well_count: container_type.well_count,
        col_count: container_type.col_count,
        is_tube: false
      }
      run[:refNames][cid] = cid
      run[:containerData][cid] = {
        id: cid,
        device_id: container.device_id,
        slot: container.slot,
        type: container_type.shortname
      }
    end

    #
    # Production request: QueueRunRequest:
    #   "run": <run>,
    #   "maxScheduleTime": <time>,
    #   "checkContainerTypeAvailability": <boolean>, # default: true
    #   "partitionGroupSize": <optional: integer>,   # unused at Strateos
    #   "partitionHorizon": <optional: time>,        # unused at Strateos
    #   "partitionSwapDeviceId": <optional: string>, # unused at Strateos
    #   "autoAccept": <boolean>,                     # default: false
    #   "cplexSeed": <optional: Int>,
    #   "requestId": <option: string>
    #
    return {
      run: run,
      autoAccept: false,
      maxScheduleTime: '60:second'
    }
  end
end
