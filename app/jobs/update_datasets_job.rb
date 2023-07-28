class UpdateDatasetsJob
  include Sidekiq::Worker
  # SidekiqUniqueJob options:
  # - Locks job when client pushes job to the queue and unlocks when server has processed job
  # - If calling perform when there is a lock, this will forward the job to the dead queue
  # - Ensure this is only processed by the dataset sidekiq worker
  sidekiq_options lock: :until_and_while_executing, on_conflict: { client: :log, server: :reject },
                  retry: false, queue: "dataset-default"

  def perform
    link_all_instructions_to_dataset_through_warp
    do_conversions
  end

  # Convert Datasets to DataObjects.
  def do_conversions
    datasets = Dataset.unconverted_datasets
    Sidekiq.logger.info("[UpdateDatasets] found #{datasets.length} datasets: #{datasets.pluck(:id).inspect}")

    datasets.each do |dataset|
      begin
        dataset.update!(status: 'processing')
      rescue ActiveRecord::StandardError => e
        Sidekiq.logger.error("[UpdateDatasets] Error while updating dataset: #{dataset.inspect} with error: #{e}")
        next
      end
      DatasetConverterJob.perform_async(dataset.id)
    end
  end

  # For datasets inserted by SCLE, there should be associated warps with linked
  # instruction_ids
  def link_all_instructions_to_dataset_through_warp
    Dataset.joins(:warp).where(instruction: nil).where.not(warp: nil).where.not(warps: { instruction_id: nil })
           .each do |dataset|
      dataset.update!("instruction_id" => dataset.warp.instruction_id)
    end
  rescue StandardError => e
    Bugsnag.notify("[UpdateDatasets] error while linking instruction to dataset through warp: #{e.inspect}")
  end
end
