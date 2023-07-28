require 'base_resource'

module Api
  module V1
    class ProgramExecutionResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :program_id
      add_attribute :run_id
      add_attribute :instruction_id
      add_attribute :user_id
      add_attribute :started_at
      add_attribute :completed_at
      add_attribute :response
      add_attribute :created_at
      add_attribute :updated_at

      has_one :program
      has_one :run
      has_one :instruction
      has_one :user

      filter :program_id
      filter :run_id
      filter :instruction_id
      filter :user_id
    end
  end
end
