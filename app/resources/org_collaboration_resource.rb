require 'base_resource'

module Api
  module V1
    class OrgCollaborationResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :topic
      add_attribute :src_org_id
      add_attribute :dest_org_id
      add_attribute :src_org_name
      add_attribute :dest_org_name

      filter :topic

      def src_org_name
        @model.src_org.name
      end

      def dest_org_name
        @model.dest_org.name
      end
    end
  end
end
