require 'base_resource'

module Api
  module V1
    class RefResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      # id is an integer
      key_type :integer

      add_attribute :container_id
      add_attribute :destiny
      add_attribute :name
      add_attribute :new_container_type
      add_attribute :orderable_material_component_id
      add_attribute :run_id
      add_attribute :container_type

      filter :container_id
      filter :name
      filter :run_id

      has_one :orderable_material_component

      has_one :container

      def container_type
        @model.container_type
      end
    end
  end
end
