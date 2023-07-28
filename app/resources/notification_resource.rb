require 'base_resource'

module Api
  module V1
    class NotificationResource < Api::BaseResource
      add_attribute :message
      add_attribute :details
      add_attribute :warp_id
      add_attribute :workcell_id
      filter :workcell_id

      def fetchable_fields
        return [ :message ] if context[:action] == "index"

        super
      end
    end
  end
end
