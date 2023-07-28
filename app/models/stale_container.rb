class StaleContainer < ApplicationRecord
  belongs_to :container, -> { with_deleted }

  searchkick(batch_size: 200, callbacks: :async, word_start: [ :container_id ])
  scope :search_import, -> { joins(:container).includes(container: :organization) }

  def search_data
    searchkick_as_json
    .merge(container.searchkick_as_json(Container.short_json))
    .merge(
        id:                       id,
        organization_subdomain:   container.organization.subdomain,
        container_label:          container.label,
        container_status:         container.status,
        location_id:              container.location_id,
        lab_id:                   container.lab_id,
        organization_name:        container.organization&.name,
        location_name:            container.location&.name
    )
  end

  # stale containers are flagged by admin and stale notices are sent to customers
  # by the StaleContainerJob. Once notified, customers have 2 weeks to respond before
  # their container is destroyed.
  def flag_for_notification
    # cannot flag a stale container for notification if it has been extended
    if admin_flagged_for_notification_at.nil? and admin_flagged_for_extension_at.nil?
      update(admin_flagged_for_notification_at: DateTime.now)
    else
      if admin_flagged_for_notification_at
        errors.add(:admin_flagged_for_notification_at, "already flagged for #{container_id}")
      end
      if admin_flagged_for_extension_at
        errors.add(:admin_flagged_for_extension_at, "already flagged for #{container_id}")
      end
      false
    end
  end

  # stale containers can be extended a 3 month grace period by customer request.
  # these containers can be collected by the StaleContainerJob again after the grace period.
  def flag_for_extension
    if admin_flagged_for_extension_at.nil?
      update(admin_flagged_for_extension_at: DateTime.now,
             admin_flagged_for_notification_at: nil,
             stale_notification_at: nil,
             will_be_destroyed_at: nil)
    else
      errors.add(:admin_flagged_for_extension_at, "already flagged for #{container_id}")
      false
    end
  end

end
