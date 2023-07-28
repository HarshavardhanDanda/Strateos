require 'base_resource'

module Api
  module V1
    class StaleContainerResource < Api::BaseResource
      add_attribute :container_id
      #? Is this related to admin code
      add_attribute :admin_flagged_for_notification_at
      add_attribute :stale_notification_at
      add_attribute :will_be_destroyed_at
      add_attribute :marked_pending_destroy_at
      add_attribute :created_at
      add_attribute :updated_at
      #? Is this related to admin code
      add_attribute :admin_flagged_for_extension_at

      has_one :container
    end
  end
end
