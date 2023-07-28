class DatasetConverterJob
  include Sidekiq::Worker
  sidekiq_options queue: "dataset-critical"

  # Given a dataset, kick off its conversion and notify corresponding relations
  def perform(dataset_id)
    log_memory_usage dataset_id, "before"

    dataset = Dataset.find(dataset_id)
    dataset_info = "id: #{dataset.id}, type: #{dataset.data_type}"

    # When we convert a dataset we need to ensure the following happens:
    # - The converter runs either successfully or unsuccessfully, either way marking the dataset 'converted'
    # - We notify the instruction/run that conversion is done
    begin
      Rails.logger.info("[DatasetConverterJob] Starting conversion of #{dataset_info} to dataobjects.")
      DatasetConverter.convert(dataset)
      Rails.logger.info("[DatasetConverterJob] Completed conversion of #{dataset_info} to dataobjects.")
    rescue StandardError => e
      Bugsnag.notify("[DatasetConverterJob] unable to convert dataset #{dataset.id} to dataobjects. #{e}")
      dataset.conversion_errors = [ "Unable to convert dataset: #{e.inspect}" ]
    ensure
      dataset.status = 'converted'
      dataset.save!
    end

    log_memory_usage dataset_id, "after"
  end

  def log_memory_usage(dataset_id, prefix)
    mb = GetProcessMem.new.mb
    Rails.logger.info "[DatasetConverterJob] #{prefix} Dataset id #{dataset_id} - MEMORY USAGE(MB): #{mb.round}"
  end
end
