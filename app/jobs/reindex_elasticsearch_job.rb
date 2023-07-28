class ReindexElasticsearchJob
  include Sidekiq::Worker

  def perform
    # allows Searchkick to find all Searchkick-registered models
    Rails.application.eager_load!

    after_at = Time.now - 3.day

    # update containers and aliquots
    [ Container, Aliquot ].each do |model|
      model.where("updated_at > ?", after_at).find_in_batches(batch_size: 25) do |batch|
        pp "BATCH SIZE IS #{batch.size}"
        Searchkick.callbacks(:bulk) do
          batch.each(&:reindex)
        end
      end
    end
  end
end
