class TempoEchoLogProcessorJob
  include Sidekiq::Worker

  REF_ID_INSTRUCTION_DELIMITER = ":"

  # @param [Hash] s3_info
  # @return [void]
  def perform(s3_info)
    bucket = s3_info['bucket']['name']
    key = s3_info['object']['key']
    size = s3_info['object']['size']

    begin
      file_name = File.basename(key)
      upload = create_upload(bucket, file_name, key, size)
      dataset = create_dataset(bucket, file_name, key)
      instructions = get_instructions(dataset)
      update_instruction_transfer_volumes(dataset.data['readings'].to_set, instructions)
      try_mark_run_complete(dataset.run_id)

      upload.update(state: Upload::STATE_OFFLINE_COMPLETE)
    rescue TempoEchoLogProcessorJob::UploadError => e
      Rails.logger.error(e.message)
      upload&.update(state: e.upload_state)
      upload&.update(exceptions: e.upload_exceptions)
    rescue StandardError => e
      Rails.logger.error("#{e} for file #{file_name}")
      upload&.update(state: Upload::STATE_OFFLINE_ERROR)
      upload&.update(exceptions: [ e ])
    end
  end

  private

  # If all acoustic_transfer instructions have been updated, indicated by the presence of `operation_as_performed`,
  # mark all instructions as complete in the run, one-by-one, in sequential order.
  #
  # @param [String] run_id
  # @return [void]
  def try_mark_run_complete(run_id)
    run = Run.find(run_id)

    unless run.completed?
      is_each_acoustic_transfer_processed =
        run.instructions
           .where(op: Autoprotocol::AcousticTransfer::NAME).all? { |i| i.operation_as_executed.present? }

      if is_each_acoustic_transfer_processed
        run.instructions.find_each(batch_size: 5) do |instruction|
          instruction.with_lock do
            unless instruction.completed?
              instruction.complete!(true)
            end
          end
        end
      end
    end
  end

  # @param [Dataset] dataset
  # @return [Array<Instruction>]
  def get_instructions(dataset)
    begin
      instructions = dataset.data['ref_id'].split(REF_ID_INSTRUCTION_DELIMITER).map { |i| Instruction.find(i) }

      unless instructions.all? { |i| i.op == Autoprotocol::AcousticTransfer::NAME }
        error = "Non acoustic-transfer instructions detected. Instruction types #{instructions.map do |i|
          "#{i.id}: #{i.op}"
        end }}"
        raise TempoEchoLogProcessorJob::UploadError.new(
          Upload::STATE_OFFLINE_NO_INSTRUCTION,
          [ error ],
          error
        )
      end

      unless instructions.all? { |i| i.run.id == dataset.run_id }
        ins_id_to_run = instructions.map do |i|
          "#{i.id}: #{i.run.id}"
        end
        error = "One or more instructions do not correspond to provided run id(#{dataset.run_id}): #{ins_id_to_run}"
        raise TempoEchoLogProcessorJob::UploadError.new(
          Upload::STATE_OFFLINE_ERROR,
          [ error ],
          error
        )
      end
    rescue ActiveRecord::RecordNotFound => e
      error = "Instruction not found: #{e.message}"
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_NO_INSTRUCTION,
        [ error ],
        error
      )
    end

    instructions
  end

  # Add `operation_as_executed`to the instruction with transfer volumes with the ACTUAL transfer volumes.
  #
  # The `readings` correspond to transfers within the acoustic_transfer
  # `instructions` from the `run` and will have the same order.
  #
  # For example, if the `run` has:
  #
  #   acoustic_transfer_0 (seq 0):
  #     a/0 -> b/0  5nl
  #     a/0 -> b/0  3nl
  #   acoustic_transfer_1 (seq 3):
  #     a/0 -> c/0  5nl
  #   acoustic_transfer_2 (seq 4):
  #     a/0 -> d/0  5nl
  #
  # the `readings` would have:
  #     a/0 -> b/0 5nl
  #     a/0 -> b/0 3nl
  #     a/0 -> c/0 5nl
  #     a/0 -> d/0 5nl
  #
  # Thus, we can process the readings in order, one by one.

  # @param [Set<Hash>] readings
  # @param [Array<Instruction>] instructions
  # @return [void]
  def update_instruction_transfer_volumes(readings, instructions)
    check_num_readings_vs_num_instructions(instructions, readings)

    instructions.sort_by(&:sequence_no).each do |instruction|

      operation_as_executed = instruction.parsed.serialize.with_indifferent_access
      operation_as_executed[:groups][0][:transfer].each do |tx|
        reading = find_reading(tx, readings, instruction)
        actual_volume_transferred = "#{reading['transfer_volume']}:nanoliter"
        parse_volume(actual_volume_transferred)
        tx[:volume] = actual_volume_transferred
      end

      instruction.operation_as_executed = operation_as_executed

      begin
        instruction.operation_as_executed_parsed
      rescue Autoprotocol::AutoprotocolError => e
        raise TempoEchoLogProcessorJob::UploadError.new(
          Upload::STATE_OFFLINE_PARSE_ERROR,
          [ e.message ],
          e.message
        )
      end
    end

    Instruction.transaction do
      instructions.each(&:save!)
    end
  rescue  TempoEchoLogProcessorJob::UploadError => e
    raise e
  rescue StandardError => e
    error = "Could not update instruction transfer volumes #{e.message}"
    raise TempoEchoLogProcessorJob::UploadError.new(
      Upload::STATE_OFFLINE_ERROR,
      [ error ],
      error
    )
  end

  # @param [Hash] transfer
  # @param [Set<Hash>] readings
  # @param [Instruction] instruction
  # @return [Hash]
  def find_reading(transfer, readings, instruction)
    instruction_from_ref_name, instruction_from_well_index = transfer[:from].split("/")
    instruction_to_ref_name, instruction_to_well_index = transfer[:to].split("/")
    from_ref = instruction.run.refs.find_by(name: instruction_from_ref_name)
    to_ref = instruction.run.refs.find_by(name: instruction_to_ref_name)

    reading_from_barcode = from_ref.container.barcode
    reading_from_well_index = from_ref.container.container_type.human_well(instruction_from_well_index)
    reading_to_barcode = to_ref.container.barcode
    reading_to_well_index = to_ref.container.container_type.human_well(instruction_to_well_index)

    volume_schema = Autoprotocol::Schema::DSL.build do
      Volume()
    end

    found_readings = readings.filter do |reading|
      reading_intended_transfer_volume = parse_volume("#{reading['intended_transfer_volume']}:nanoliter")

      reading_intended_transfer_volume.value == volume_schema.parse(transfer[:volume]).value &&
        reading['source_plate_barcode'] == reading_from_barcode &&
        reading['destination_plate_barcode'] == reading_to_barcode &&
        reading['source_human_well'] == reading_from_well_index &&
        reading['destination_human_well'] == reading_to_well_index
    end

    found_reading = found_readings.first

    if found_reading.nil?
      error = "Could not find readings for acoustic transfer. Transfer: #{transfer}."
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_ERROR,
        [ error ],
        "Could not update instruction transfer volumes #{error}"
      )
    end

    readings.delete(found_reading)

    found_reading
  end

  # @param [String] volume
  # @return [Autoprotocol::Schema::Volume]
  def parse_volume(volume)
    volume_schema = Autoprotocol::Schema::DSL.build do
      Volume()
    end
    parsed_volume = volume_schema.parse(volume)
    if parsed_volume.errors.present?
      error = "Invalid volume: #{volume}. #{parsed_volume.errors.join(' ')}"
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_PARSE_ERROR,
        [ error ],
        error
      )
    end
    parsed_volume
  end

  # @param [Array<Instruction>] instructions
  # @param [Set<Hash>] readings
  # @return [Void]
  def check_num_readings_vs_num_instructions(instructions, readings)
    total_transfers = instructions.flat_map { |i| i.parsed.groups[0][:transfer] }.size

    unless total_transfers == readings.size
      error = "Number of transfers:#{readings.size} differs from expected: #{total_transfers}"
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_ERROR,
        [ error ],
        "Could not update instruction transfer volumes #{error}"
      )
    end
  end

  # @param [String] bucket
  # @param [String] file_name
  # @param [String] key
  # @return [Dataset]
  def create_dataset(bucket, file_name, key)
    dataset = Dataset.new
    dataset_errors = Dataset.smr3_from_data(dataset, bucket, key, file_name)

    if dataset_errors.present? && dataset_errors.any?
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_PARSE_ERROR,
        dataset_errors,
        "CSV Parsing Errors: #{dataset_errors} for file #{file_name}"
      )

    end
    dataset.run_id = dataset.data['order_id']
    dataset.analysis_tool = 'Raw Echo Output'
    dataset.analysis_tool_version = '1.0'
    dataset.save!

    DatasetConverterJob.new.perform(dataset.id)

    if dataset.conversion_errors.present?
      raise TempoEchoLogProcessorJob::UploadError.new(
        Upload::STATE_OFFLINE_INVALID_DATA_OBJECT,
        dataset.conversion_errors,
        "Could not create data objects due to #{dataset.conversion_errors}"
      )
    end

    dataset
  end

  # @param [String] bucket
  # @param [String] file_name
  # @param [String] key
  # @param [String] size
  # @return [Upload]
  def create_upload(bucket, file_name, key, size)
    upload = Upload.find_or_initialize_by(bucket: bucket, key: key)
    upload.state = Upload::STATE_OFFLINE
    upload.last_modified = Time.now
    upload.is_multipart = false
    upload.file_name = file_name
    upload.file_size = size
    upload.user = Admin.new(id: 'unknown')
    upload.save!
    upload
  end

  class UploadError < StandardError
    attr_reader :upload_state, :upload_exceptions

    def initialize(upload_state, upload_exceptions, message)
      super(message)
      @upload_state = upload_state
      @upload_exceptions = upload_exceptions
    end
  end
end
