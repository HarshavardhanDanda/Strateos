require 'base_resource'

module Api
  module V1
    class AuditResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :auditable_id
      add_attribute :auditable_type
      add_attribute :associated_id
      add_attribute :associated_type
      add_attribute :action
      add_attribute :created_at
      add_attribute :user_id
      add_attribute :comment

      filter :auditable_id
      filter :auditable_type
      filter :associated_id
      filter :associated_type
    end
  end
end
