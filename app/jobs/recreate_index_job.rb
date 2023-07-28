class RecreateIndexJob
  include Sidekiq::Worker

  # Recreate index from scratch
  # To be used when making breaking changes to a model's index mapping.
  #
  # Note: Only models with "queue" callback strategy have special handling
  # for data written DURING migration. If promote==false, job must be re-enabled separately
  # after promotion.
  #
  # @param [ActiveRecord] klass class (e.g. Container)
  # @param [FalseClass] promote - Promote the new index?
  # @param [TrueClass] retain - Retain the existing index?
  def perform(klass:, promote: false, retain: true)

    unless Searchkick.models.include?(klass)
      Rails.logger.error("#{klass} is not a Searchkick-enabled model."\
                         " Searchkick models:#{Searchkick.models.map(&:name)}.")
      return
    end

    unless promote
      Rails.logger.info("Promotion and cron-job re-enable (if applicable) must be handled separately.\n"\
                        "Monitor the new index with Searchkick.reindex_status(index.name).")
    end

    # Pause cron queue job if found
    process_queue_cron_job = Sidekiq::Cron::Job.all
                                               .find do |j|
      j.klass == SearchkickProcessQueueJob.name && j.args.include?(klass.name)
    end

    unless process_queue_cron_job.nil?
      Rails.logger.info("Found and disabling SearchkickProcessQueueJob for class: #{klass}")
      process_queue_cron_job.disable!
    end

    # The following call will create a new index by spawning multiple Searchkick::BulkReindexJobs
    #
    # For example,
    # Enqueued Searchkick::BulkReindexJob (Job ID: d81c46e4-f6f2-4ca7-8239-13ad2ab09f14) to Sidekiq(searchkick)
    # with arguments: {
    # :class_name=>"Container",
    # :index_name=>"containers_development_20230110210305108",
    # :batch_id=>7,
    # :record_ids=>["ct1arkbed3pgwj9g2u", "ct1arkbedm4tk2h67m", ..."]}

    # Index will be NOT be promoted automatically if async = true
    async = promote ? { wait: true } : true

    # Disable refresh during reindexing
    klass.reindex(async: async, retain: retain, refresh_interval: "-1")

    if promote && !process_queue_cron_job.nil?
      # Re-enable process queue job if there was one
      Rails.logger.info("Re-enabling SearchkickProcessQueueJob for class: #{klass}")
      process_queue_cron_job.enable!
    end
  end
end
