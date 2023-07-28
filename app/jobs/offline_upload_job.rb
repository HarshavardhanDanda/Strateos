class OfflineUploadJob
  include Sidekiq::Worker
  sidekiq_options queue: "dataset-default"

  # key format: runid_barcode_timestamp.csv
  def perform(s3_info)
    bucket = s3_info['bucket']['name']
    key = s3_info['object']['key']
    size = s3_info['object']['size']

    upload = nil
    begin
      file_name, run_id, barcode, file_error = parse_file_name(key)

      unless file_error.nil?
        Rails.logger.info("[OfflineUploadJob]: #{file_error} for file #{file_name}")
        return
      end

      upload = Upload.upsert_by_s3_object(bucket, key, size)

      if upload.nil?
        Rails.logger.info("[OfflineUploadJob]: Could not find upload with bucket: #{bucket} and key: #{key}")
        return
      end

      unless file_error.nil?
        upload.update(state: Upload::STATE_OFFLINE_BAD_FILE_NAME)
        upload.update(exceptions:
[ 'Invalid file name format, allowed file name format is runid_barcode_timestamp' ])
        Rails.logger.info("[OfflineUploadJob]: #{file_error} for file #{file_name}")
        return upload
      end

      instruction, state, error = get_instruction_data(run_id, barcode)
      unless error.nil?
        upload.update(state: state)
        upload.update(exceptions: [ error ])
        Rails.logger.info("[OfflineUploadJob]: Instruction does not exist for file #{file_name}")
        return upload
      end

      if instruction.dataset.present?
        upload.update(state: Upload::STATE_OFFLINE_ALREADY_DATASET)
        upload.update(exceptions: [ "Data set already exists for instruction #{instruction.id}" ])
        Rails.logger.info("[OfflineUploadJob]: Dataset already exists for instruction #{instruction.id}")
        return upload
      end

      dataset, errors = Dataset.from_data(instruction, { :upload_id => upload.id })
      if !errors.nil? && !errors.empty?
        upload.update(state: Upload::STATE_OFFLINE_ERROR)
        upload.update(exceptions: errors)
        Rails.logger.info("[OfflineUploadJob]: Errors: #{errors} for file #{file_name}")
        return upload
      end

      upload.update(state: Upload::STATE_OFFLINE_COMPLETE)
      return upload
    rescue Exception => e
      Rails.logger.info("[OfflineUploadJob]: #{e} for file #{file_name}")
      upload&.update(state: Upload::STATE_OFFLINE_ERROR)
      upload&.update(exceptions: [ e ])
      return upload
    end
  end

  def parse_file_name(file_key)
    error = "Invalid File Name Format"
    file_name = File.basename(file_key)
    if file_name.split('_').length > 2
      run_id, barcode = file_name.split('_').slice(0, 2)
      error = nil
    end
    [ file_name, run_id, barcode, error ]
  end

  def get_instruction_data(run_id, barcode)
    # container deleted_at column should be null to get a container from below find_by
    run = Run.find_by_id(run_id)
    if run.nil?
      Rails.logger.info("[OfflineUploadJob]: No Run found for run_id: #{run_id}.")
      return [ nil, Upload::STATE_OFFLINE_NO_RUN, "No run found for the run_id #{run_id}" ]
    end
    container = run.containers.find_by(barcode: barcode, lab: run.lab.shared_ccs_labs)
    if container.nil?
      Rails.logger.info("[OfflineUploadJob]: No Containers found for barcode #{barcode} within run: #{run.id}.")
      return [ nil, Upload::STATE_OFFLINE_INVALID_BARCODE,
               "No Containers found for the barcode #{barcode} within run: #{run_id}" ]
    end
    # TODO: This does not handle the business case where one plate is read many times within the same run.
    instruction = run.instructions.with_data_name.find { |ins| !(ins.refs&.find { |ref|
 ref.container.id == container.id}).nil? }
    if instruction.nil?
      return [ nil, Upload::STATE_OFFLINE_NO_INSTRUCTION,
               "[OfflineUploadJob]: No Instruction found for the barcoded-container matching the run_id #{run_id}" ]
    end
    [ instruction, nil, nil ]
  end
end
