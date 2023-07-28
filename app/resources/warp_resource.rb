require 'base_resource'

module Api
  module V1
    class WarpResource < Api::BaseResource
      add_attribute :command
      add_attribute :completed_at
      add_attribute :created_at
      add_attribute :device_id
      add_attribute :instruction_id
      add_attribute :max_duration
      add_attribute :min_duration
      add_attribute :nominal_duration
      add_attribute :reported_completed_at
      add_attribute :reported_started_at
      add_attribute :run_id
      add_attribute :state

      has_many :warp_events
      has_one  :dataset
    end
  end
end
