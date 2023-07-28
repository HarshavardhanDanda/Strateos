require 'base_resource'

module Api
  module V1
    class ScheduleRequestResource < Api::BaseResource
      key_type :integer

      add_attribute :created_at
      add_attribute :request
      add_attribute :result
      add_attribute :run_id
      add_attribute :status
      add_attribute :updated_at
      add_attribute :workcell_id

      has_one :run
    end
  end
end
