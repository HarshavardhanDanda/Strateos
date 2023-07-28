class StaleContainersJob
  include Sidekiq::Worker

  DESTROY_AFTER_TIME = 2.weeks
  STALE_AFTER_TIME   = 3.months
  EXTENSION_TIME     = 3.months

  def initialize
    # Collect the stale container IDs so we can reindex them at the end
    # This must be done for record updates that bypass callbacks
    @affected_stale_container_ids = []
  end

  # stale containers are containers that have not been used in a run for > 3 months
  def collect_stale

    containers_with_open_run =
      Run.select(:container_id)
         .joins(:refs)
         .where(status: Run::OPEN_STATES)

    stale_ids = Container.joins(refs: :run)
                         .includes(:stale_container)
                         .where(stale_containers: { id: nil })
                         .where(status: Container::STATUS_AVAILABLE)
                         .where.not(test_mode: true)
                         .where.not(id: containers_with_open_run)
                         .where.not(location_id: nil)
                         .group(:id)
                         .having('MAX(runs.created_at) < ?', STALE_AFTER_TIME.ago)
                         .pluck(:id)

    stale_containers = stale_ids.map do |stale_id|
      StaleContainer.new(container_id: stale_id)
    end

    StaleContainer.import(stale_containers)

    @affected_stale_container_ids << stale_ids

    # reindex the container models as well so that Elasticsearch is informed of staleness.
    Searchkick.callbacks(:bulk) do
      Container.with_deleted.find(stale_ids).each(&:reindex)
    end
  end

  # stale containers can be extended a grace period by customer request. these containers
  # will have a 3 month grace period, after which they can be collected by stale again
  #
  def collect_expired_extensions
    stale_containers = StaleContainer.where("admin_flagged_for_extension_at <= ?", EXTENSION_TIME.ago)
    stale_containers.update_all(
      admin_flagged_for_extension_at: nil,
      stale_notification_at: nil,
      will_be_destroyed_at: nil,
      marked_pending_destroy_at: nil
    )
    @affected_stale_container_ids << stale_containers.pluck(:id)
  end

  # marks stale containers for destruction 2 weeks after sending the stale notification
  def mark_pending_destroy
    stales = StaleContainer.joins(:container)
                           .where("stale_notification_at <= ?", DESTROY_AFTER_TIME.ago)
                           .where(marked_pending_destroy_at: nil)
                           .where(admin_flagged_for_extension_at: nil)

    stales.each do |stale|
      ActiveRecord::Base.transaction do
        stale.update!(marked_pending_destroy_at: DateTime.now)
        stale.container.update!(status: 'pending_destroy')
        ContainerDestructionRequest.create!(job_id: self.class.name, container: stale.container)
      end
    end
  end

  # remove no longer stale containers. these are containers that were marked as stale
  # and then used in a run
  def remove_recently_used_container_from_stale
    stale_containers = StaleContainer.joins(container: { refs: :run })
                                     .group(:id)
                                     .having('MAX(runs.created_at) > stale_containers.updated_at')
                                     .select(:id, :container_id)

    stale_ids     = stale_containers.map(&:id)
    container_ids = stale_containers.map(&:container_id)

    StaleContainer.where(id: stale_ids).destroy_all

    # reindex the container models as well so that Elasticsearch is informed of staleness.
    Searchkick.callbacks(:bulk) do
      Container.with_deleted.find(container_ids).each(&:reindex)
    end
  end

  # Remove stale containers where the container is no longer available. This can happen if
  # it is destroyed through some other means, or shipped back, etc
  def remove_altered_containers_from_stale
    stale_containers = StaleContainer.joins(:container)
                                     .group(:id)
                                     .where.not("containers.status = ?", Container::STATUS_AVAILABLE)
                                     .select(:id, :container_id)

    stale_ids     = stale_containers.map(&:id)
    container_ids = stale_containers.map(&:container_id)

    StaleContainer.where(id: stale_ids).destroy_all

    # reindex the container models as well so that Elasticsearch is informed of staleness.
    Searchkick.callbacks(:bulk) do
      Container.with_deleted.find(container_ids).each(&:reindex)
    end
  end

  # send notifications for all stale containers that have been flagged for notification
  # but have not had their notification sent
  def notify_organizations
    # all stale containers that need notifications sent
    stale_container_list = StaleContainer.includes(:container)
                                         .where(stale_notification_at: nil)
                                         .where.not(admin_flagged_for_notification_at: nil)
                                         .where(admin_flagged_for_extension_at: nil)

    # hash mapping organization to stale containers
    organization_stale_containers = stale_container_list.group_by do |stale_container|
      stale_container.container.organization_id
    end

    organization_stale_containers.each do |org_id, stale_containers|
      NOTIFICATION_SERVICE.stale_container_notice(org_id, stale_containers)

      StaleContainer.where(id: stale_containers.map(&:id))
                    .update_all(stale_notification_at: DateTime.now,
                                will_be_destroyed_at: DESTROY_AFTER_TIME.from_now)
    end

    @affected_stale_container_ids << stale_container_list.pluck(:id)

  end

  def perform
    remove_recently_used_container_from_stale
    remove_altered_containers_from_stale
    notify_organizations
    mark_pending_destroy
    collect_expired_extensions
    collect_stale

    # bulk sql methods (import, update_all) bypass callbacks so we need to manually
    # reindex
    Searchkick.callbacks(:bulk) do
      StaleContainer.where(id: @affected_stale_container_ids).reindex
    end
  end
end
