class Dataset < ApplicationRecord
  has_snowflake_id('d')
  acts_as_paranoid

  audit_trail only: [ :instruction_id, :run_id, :uploaded_by ]

  belongs_to :project
  belongs_to :warp
  belongs_to :device
  belongs_to :instruction
  belongs_to :run
  has_many :data_objects, dependent: :destroy

  # For our analytics job
  scope :created_last_Ndays, ->(num_days) { where("created_at > ?", Time.now - num_days.days) }

  scope :unconverted, -> { where(status: 'unconverted') }
  scope :processing, -> { where(status: 'processing') }

  scope :is_analysis, -> { where.not(run_id: nil) }
  scope :is_measurement, -> { where.not(instruction_id: nil) }

  audited only: [ :id, :title, :deleted_at ], associated_with: :run

  validates_presence_of :data_type
  validate :mutual_exclusivity_if_context_present

  # Datasets typically are converted internally by the web app, but there is a push to move the conversion processing
  # logic outside of the webapp. Below are the dataset data types that have logic within the web code to convert them
  # into data objects that'll be visualized in the console.
  DATA_TYPES_INTERNALLY_CONVERTED = [
    'autopick',
    'envision_platereader',
    'file',
    'gel',
    'image_plate',
    'measure',
    'mesoscale_platereader',
    'platereader',
    'spectrophotometry',
    'qpcr',
    'sanger_sequence',
    'lcms'
  ]

  DATA_TYPES_MANUALLY_MADE_BY_OPS = [ 'measure' ]

  INSTRUCTION_TYPES_WITHOUT_UPLOAD = [ Autoprotocol::MeasureConcentration,
                                       Autoprotocol::MeasureMass,
                                       Autoprotocol::MeasureVolume,
                                       Autoprotocol::CountCells ]

  before_save lambda {
    self.is_externally_converted = DATA_TYPES_INTERNALLY_CONVERTED.exclude? self.data_type
  }

  after_commit lambda {
    if data_type == 'sanger_sequence' and new_record?
      ParseAbiSeqDataJob.perform_async id
    end
  }

  after_update_commit lambda {
    WORKFLOW_RABBIT_SERVICE.publish_dataset_update(dataset: self)
  }

  after_create_commit lambda {
    EVENT_SERVICE.publish_dataset_created_event(dataset: self)
  }

  after_update_commit :finalize, if: proc { |ds| ds.saved_change_to_status?(from: 'processing', to: 'converted') }

  # Side effects after dataset conversion
  def finalize
    Dataset.dataset_attached(self)
  rescue StandardError => e
    Rails.logger.error("Dataset #{self.id} attachment instruction execution failed: #{e.inspect}")
  ensure # This callback is called when a dataset is "converted" so data finalization should always occur.
    self.find_instruction.try(:finalized_data_conversion)
  end

  def mutual_exclusivity_if_context_present
    unless (run_id.nil? and instruction_id.nil?) or (run_id.present? ^ instruction_id.present?)
      context_changed = instruction_id_changed? ? :instruction_id : :run_id
      errors.add(context_changed, "A dataset must have an instruction OR run, not both.")
    end
  end

  def self.unconverted_datasets
    Dataset.where('status': 'unconverted')
           .where('conversion_errors': '{}')
           .where(is_externally_converted: false)
           .where('instruction_id is not null OR run_id is not null')
  end

  def self.where_in_project(project_id)
    Dataset.joins(instruction: [ { run: :project } ])
           .where(projects: { id: project_id })
  end

  def supported_formats
    case data_type
    when 'platereader', 'qpcr'
      [ "csv", "json" ]
    when 'image_plate', 'gel'
      [ "raw", "json" ]
    when 'autopick'
      # Older autopick data don't have images.
      if data.include?('bucket') && data.include?('key')
        [ "raw", "json" ]
      else
        [ "json" ]
      end
    when 'sanger_sequence'
      [ "zip" ]
    when 'measure'
      [ "json", "csv" ]
    when 'mesoscale_platereader'
      [ 'json', 'csv' ]
    when 'envision_platereader'
      [ 'json', 'csv' ]
    when 'spectrophotometry'
      [ 'json', 'csv' ]
    else
      [ "json" ]
    end
  end

  def to_csv
    csv_data =
      case data_type
      when 'platereader'
        platereader_as_csv
      when 'qpcr'
        qpcr_as_csv
      when 'measure'
        measure_as_csv
      when 'mesoscale_platereader'
        mesoscale_platereader_as_csv
      when 'envision_platereader'
        envision_platereader_as_csv
      when 'spectrophotometry'
        spectrophotometry_as_csv
      else
        []
      end

    # return empty csv if no data
    return "" if csv_data.empty?

    # Append aliquot fields if container exists.
    #  - This depends on the header names being Refname and Well
    #
    #  Add these fields
    #  - Add Container Id
    #  - Add Aliquot Id
    #  - Add Aliquot Name
    #  - Add Aliquot Volume
    #  - Add Aliquot Properties
    header_row = csv_data[0]

    run               = self.run
    refname_row_index = header_row.find_index('Refname')
    well_row_index    = header_row.find_index('Well')
    refnames          = csv_data[1..].map { |v| v[refname_row_index] }.uniq
    refs              = run.refs.includes(:container).where(name: refnames)
    containers        = refs.map(&:container).compact
    aliquots          = Aliquot
                        .includes(
                          [ :aliquots_compound_links,
                            { compound_links:
                                [ :compound,
                                  { contextual_custom_properties: [ :contextual_custom_properties_config ] } ] } ]
                        ).with_deleted.where(container: containers)

    changed_cc_properties_by_container = containers.map { |container|
      [ container.id, container.cc_properties_merged_with_outs_of(run) ]
    }.to_h

    container_cc_property_keys =
      changed_cc_properties_by_container.flat_map { |_, cc_properties| cc_properties.pluck(:key) }.uniq

    container_property_keys = containers.map { |container|
      container.properties = container.properties_merged_with_outs_of(run)
    }.flat_map(&:keys).uniq

    # Set of aliquot properties used in any of the aliquots.
    # TODO: fetch properties from only the aliquots in the list
    aliquot_property_keys = aliquots.map { |aliquot|
      aliquot.properties = aliquot.properties_merged_with_outs_of(run)
    }.flat_map(&:keys).uniq

    aliquot_cc_property_keys = aliquots.map { |aliquot|
      aliquot.cc_properties_merged_with_outs_of(run).map { |cc_prop| cc_prop[:key] }
    }.flatten.uniq

    # To determine the max compound link index of aliquots for rendering the headers
    max_compound_links = 0
    organization_id = run.organization.id
    aliquots.map do |aliquot|
      aliquot_compound_links = aliquot.aliquots_compound_links
      max_compound_links = if aliquot_compound_links.length > max_compound_links
                             aliquot_compound_links.length
                           else
                             max_compound_links
                           end
    end

    compound_link_ccpc_configs = ContextualCustomPropertiesConfig.where(organization_id: organization_id,
                                                                        context_type: "CompoundLink")
                                                                 .order(:label)

    # To create the headers for aliquot_compound_links
    aliquot_compound_link_keys = []
    (0..max_compound_links - 1).each do |n|
      aliquot_compound_link_keys.push("cp_#{n}_smiles")
      aliquot_compound_link_keys.push("cp_#{n}_compound_link_id")
      compound_link_ccpc_configs.each do |v|
        aliquot_compound_link_keys.push("cp_#{n}_#{v.key}")
      end
    end

    unless containers.empty?
      aliquots_by_container_id = aliquots.group_by(&:container_id)

      aliquots_map = aliquots_by_container_id.transform_values { |aqs| aqs.map { |aq| [ aq.well_idx, aq ] }.to_h }

      aliquot_property_keys.sort!
      aliquot_cc_property_keys.sort!
      container_property_keys.sort!
      container_cc_property_keys.sort!
      csv_data = csv_data.map.with_index do |row, index|
        if index == 0
          # append header fields
          row +
            [ "Container ID", "Aliquot ID", "Aliquot Name", "Aliquot Volume (ul)" ] +
            aliquot_property_keys + aliquot_cc_property_keys + container_property_keys + container_cc_property_keys +
            aliquot_compound_link_keys
        else
          refname = row[refname_row_index]
          raw_well_idx = row[well_row_index]
          container = refs.find { |ref| ref.name == refname }&.container
          container_type = container.try(:container_type)
          robot_well_idx = container_type.try(:robot_well, raw_well_idx.to_s)
          human_well_idx = container_type.try(:human_well, raw_well_idx.to_s)
          aliquot = aliquots_map[container&.id][robot_well_idx] if aliquots_map[container&.id].present?

          # normalize Well field to be capitalized.
          row[well_row_index] = (human_well_idx || raw_well_idx || "").to_s.upcase

          added_fields = [
            container.try(:id),
            aliquot.try(:id),
            aliquot.try(:name_from_outs_of, run),
            aliquot.try(:volume_ul)
          ]

          added_aliquot_prop_fields = aliquot_property_keys.map do |k|
            (aliquot.try(:properties) || {})[k]
          end

          # Aliquots may exist in data but not in database, platereader can have transparency data for empty aliquots
          aliquot_changed_cc_properties = aliquot.nil? ? [] : aliquot.cc_properties_merged_with_outs_of(run)
          added_aliquot_cc_prop_fields = aliquot_cc_property_keys.map do |k|
            aliquot_changed_cc_properties.find { |ccp| ccp[:key] == k }.try(:[], :value)
          end

          added_container_prop_fields = container_property_keys.map do |k|
            (container.try(:properties) || {})[k]
          end

          container_changed_cc_properties = changed_cc_properties_by_container[container&.id] || []
          added_container_cc_prop_fields = container_cc_property_keys.map do |k|
            container_changed_cc_properties.find { |ccp| ccp[:key] == k }.try(:[], :value)
          end

          # Creating a hash for storing respective values of aliquot_compound_links in a row
          compound_links_changed_cc_properties = {}
          compound_links = aliquot.nil? ? [] : aliquot.compound_links.to_a

          compound_links.map.with_index do |compound_link, idx|
            compound_links_changed_cc_properties["cp_#{idx}_smiles"] = compound_link.compound.try(:smiles)
            compound_links_changed_cc_properties["cp_#{idx}_compound_link_id"] = compound_link.id
            compound_link_ccps = compound_link.contextual_custom_properties

            compound_link_ccps.map do |compound_link_ccp|
              compound_link_ccpc = compound_link_ccp.contextual_custom_properties_config
              compound_links_changed_cc_properties["cp_#{idx}_#{compound_link_ccpc.key}"] = compound_link_ccp.value
            end
          end

          # Assigning the aliquot_compound_links and ccps to their respective columns
          added_aliquot_compound_links_prop_fields = aliquot_compound_link_keys.flat_map do |k|
            values = compound_links_changed_cc_properties.select { |key| key == k }.values
            values.is_a?(Array) and values.empty? ? nil : values
          end

          # Column headers order
          row +
            added_fields +
            added_aliquot_prop_fields +
            added_aliquot_cc_prop_fields +
            added_container_prop_fields +
            added_container_cc_prop_fields +
            added_aliquot_compound_links_prop_fields
        end
      end
    end

    CSV.generate do |csv|
      csv_data.each do |row|
        csv << row
      end
    end
  end

  def platereader_as_csv
    csv_data = []

    op =
      case instruction.op
      when 'absorbance'
        "OD #{instruction.operation['wavelength']}"
      when 'fluorescence'
        "Fluorescence"
      when 'luminescence'
        "Luminescence"
      end

    header = [ 'Refname', 'Well', op ]

    csv_data << header

    refname = instruction.operation['object']

    data.each do |human_well_idx, value|
      row = [ refname, human_well_idx, value.sum / value.length ]

      csv_data << row
    end

    csv_data
  end

  def qpcr_as_csv
    postprocessed_data = data['postprocessed_data']
    self.class.get_csv_from_qpcr_data(postprocessed_data, instruction.operation['object'])
  end

  def measure_as_csv
    csv_data = []

    case parameters['measurement']
    when 'concentration'
      header = [
        'Refname',
        'Well',
        "Concentration: #{parameters['type']} (#{parameters['type'] == 'protein' ? 'mg/mL' : 'ng/uL'})"
      ]

      (header << "Quality Score (A260/A280)") if parameters['type'] != 'protein'

      csv_data << header

      data['data'].each do |container_data|
        container_data['wells'].each do |well_data|
          data = [
            container_data['refName'],
            well_data['well'],
            well_data['concentration'].split(':')[0]
          ]
          (data << well_data['qualityScore'].split(':')[0]) if parameters['type'] != 'protein'

          csv_data << data
        end
      end
    when 'volume'
      # header
      csv_data << [ 'Refname', 'Well', 'Volume (uL)' ]

      data['data'].each do |container_data|
        container_data['wells'].each do |well_data|
          csv_data << [
            container_data['refName'],
            well_data['well'],
            well_data['volume'].split(':')[0]
          ]
        end
      end
    when 'mass'
      # header
      csv_data << [ 'Refname', 'Mass (g)' ]

      # should only be one ref_name.
      # But for backwards compatibility are allowing users to submit their own.
      ref_name = instruction.operation['object']

      data['data'].each do |container_data|
        csv_data << [
          container_data['refName'] || ref_name,
          container_data['mass'].split(':')[0]
        ]
      end
    when 'count_cells'
      labels = []
      data['data'].each do |container_data|
        container_data['wells'].each do |well_data|
          labels.concat(well_data.keys)
        end
      end
      labels = labels.uniq.select { |l| l != 'well' && l != 'wellIndex' }

      header = [ 'Refname', 'Well' ] + labels

      csv_data << header

      data['data'].each do |container_data|
        container_data['wells'].each do |well_data|
          data = [
            container_data['refName'],
            well_data['well']
          ]

          data += labels.map { |l| well_data[l] }

          csv_data << data
        end
      end
    end

    csv_data
  end

  def mesoscale_platereader_as_csv
    csv_data = []

    headers = [ 'Refname', 'Well', 'Assay', 'Spot', 'Signal' ]
    csv_data << headers

    ref_name = instruction.operation['object']

    data['data']['spot_data'].each do |spot, _|
      row = headers.map do |h|
        case h
        when 'Refname'
          ref_name
        when 'Well'
          spot['well']
        when 'Assay'
          spot['assay']
        when 'Spot'
          spot['spot']
        when 'Signal'
          spot['raw_data']
        end
      end
      csv_data << row
    end

    csv_data
  end

  def envision_platereader_as_csv
    csv_data = []

    headers = [ 'Refname', 'Well', 'Value', 'Reading', 'Type' ]
    csv_data << headers

    ref_name = instruction.operation['object']

    data['readings'].each do |reading|
      row = headers.map do |h|
        case h
        when 'Refname'
          ref_name
        when 'Well'
          reading['well']
        when 'Value'
          reading['value']
        when 'Reading'
          reading['index']
        when 'Type'
          reading['type']
        end
      end
      csv_data << row
    end

    csv_data
  end

  def spectrophotometry_as_csv
    csv_data = []

    headers = [ 'Refname', 'Well', 'Value', 'Time', 'Wavelength Index', 'Group Index', 'Interval Index' ]
    csv_data << headers

    ref_name = instruction.operation['object']

    data['readings'].each do |reading|
      row = headers.map do |h|
        case h
        when 'Refname'
          ref_name
        when 'Well'
          reading['well']
        when 'Value'
          reading['value']
        when 'Wavelength Index'
          reading['wavelength_index']
        when 'Group Index'
          reading['group_index']
        when 'Interval Index'
          reading['interval_index']
        when 'Time'
          date_time = reading['time']
          unless date_time.nil?
            date_obj = DateTime.parse(date_time)
            date_obj.strftime('%m/%d/%Y %H:%M:%S')
          end
        end
      end
      csv_data << row
    end

    csv_data
  end

  def container
    if self.instruction and self.run
      # Instructions that refer to one ref, store their ref's name within the `object` field.
      # Using this refname we can fetch the container.
      # A more full proof, yet more costly, method would be to reparse the instructions json to get
      # the list of refs.

      refname = self.instruction.operation['object']
      ref     = self.run.refs.find_by_name(refname)

      ref.try(:container)
    end
  end

  def run
    Run.find_by_id(run_id) || instruction.try(:run)
  end

  def can_be_seen_by?(user)
    if self.uploaded_by == user.id
      true
    elsif not self.run.nil?
      return self.run.can_be_seen_by?(user)
    elsif not self.instruction.nil?
      return false if self.instruction.run.nil?

      return self.instruction.run.can_be_seen_by?(user)
    elsif not self.warp.nil?
      return false if self.warp.run.nil?

      return self.warp.run.can_be_seen_by?(user)
    else
      false
    end
  end

  def is_owner?(user)
    self.uploaded_by == user.id
  end

  def manually_created?
    DATA_TYPES_MANUALLY_MADE_BY_OPS.include?(self.data_type)
  end

  # When a dataset is manually uploaded by Ops we convert it here to
  # the same format that would have been written by TCLE.
  #
  # @param [Instruction] instruction
  # @param [Hash] new_data The raw data of the Dataset { upload_id, name }
  # @param [Hash] parameters The `parameters` field of Dataset
  #
  # @return [new_model, errors]
  def self.from_data(instruction, new_data, parameters = nil)
    new_model = Dataset.new
    comment = new_data[:comment]
    if comment.present?
      new_model.audit_comment = comment
    end
    errors = []
    new_model.instruction = instruction
    new_model.parameters = parameters

    parsed_instruction = instruction.parsed

    upload = Upload.find(new_data[:upload_id]) if new_data.key? :upload_id

    if INSTRUCTION_TYPES_WITHOUT_UPLOAD.none? { |type| type === parsed_instruction } && upload.nil?
      new_model.errors.add(:dataset, "requires '#{parsed_instruction.class}' to have a valid upload_id")
      raise ActiveRecord::RecordInvalid.new(new_model)
    end

    bucket = upload&.bucket || S3_UPLOAD_BUCKET
    key = upload&.key
    file_name = upload&.file_name || new_data[:name]

    case parsed_instruction
    when Autoprotocol::Absorbance, Autoprotocol::Fluorescence, Autoprotocol::Luminescence
      # Note[crc], this is shit, ideally this would be done on a background thread, delay()
      # won't help as it also executes on THE thread.
      # Left here because I don't have time to be investigating other hacks right now, and
      # this should be a relatively uncommon operation anyway.
      xml = StringIO.new('', 'w')
      client = S3Helper.instance.client
      client.get_object(bucket: bucket, key: key) do |chunk|
        xml.write(chunk)
      end

      parser = Tecan::PlateReadParser.new(StringIO.new(xml.string))
      pretty = StringIO.new('', 'w')
      values = StringIO.new('', 'w')
      parser.pretty_csv(pretty)
      parser.values_csv(values)

      pretty_name = "#{file_name.sub(/\.xml$/, '')}.csv"
      values_name = "#{file_name.sub(/\.xml$/, '')}_raw.csv"

      pretty_key = AwsHelper.safe_key "uploads/#{SecureRandom.uuid}/#{pretty_name}"
      values_key = AwsHelper.safe_key "uploads/#{SecureRandom.uuid}/#{values_name}"

      client.put_object(bucket: bucket, key: pretty_key, body: pretty.string)
      client.put_object(bucket: bucket, key: values_key, body: values.string)

      reading = parser.labels[0]

      new_model.data_type = "platereader"
      new_model.parameters = reading["parameters"]
      new_model.metadata = reading["metadata"]
      new_model.data = reading["data"]
      new_model.attachments << { name: pretty_name, bucket: bucket, key: pretty_key }
      new_model.attachments << { name: values_name, bucket: bucket, key: values_key }
    when Autoprotocol::GelSeparate, Autoprotocol::GelPurify
      new_model.data_type = "gel"
      new_model.attachments << { name: file_name, bucket: bucket, key: key }
    when Autoprotocol::Thermocycle
      self.qpcr_from_data(new_model, bucket, key, file_name)
    when Autoprotocol::SangerSequence
      new_model.data_type = "sanger_sequence"
      new_model.attachments << { name: file_name, bucket: bucket, key: key }
    when Autoprotocol::LCMS
      new_model.data_type = "file"
      new_model.attachments << { bucket: bucket, key: key }
    when Autoprotocol::ImagePlate, Autoprotocol::Image
      new_model.data_type = "image_plate"
      new_model.data = { bucket: bucket, key: key }
    when Autoprotocol::MeasureConcentration,
         Autoprotocol::MeasureMass,
         Autoprotocol::MeasureVolume,
         Autoprotocol::CountCells
      new_model.data_type = "measure"
      new_model.data = new_data
    when Autoprotocol::Spectrophotometry
      errors = self.spectro_from_data(new_model, bucket, key, file_name)
    when Autoprotocol::LCMRM
      new_model.data_type = "lcmrm"
      new_model.attachments << { name: file_name, bucket: bucket, key: key }
    else
      new_model.data_type = "file"
      new_model.attachments << { name: file_name, bucket: bucket, key: key }
    end
    if errors.empty? && new_model.save
      dataset_attached(new_model)
    end
    return [ new_model, errors ]
  end

  def self.spectro_from_data(new_dataset_model, bucket, key, file_name)
    csv_str = StringIO.new('', 'r+')
    S3Helper.instance.client.get_object(bucket: bucket, key: key) do |chunk|
      csv_str.write(chunk)
    end

    encoded_csv_str = csv_str.string.force_encoding('iso-8859-1').encode('utf-8')
    encoding = Encoding::UTF_8
    rows = nil
    begin
      rows = CSV.parse(encoded_csv_str, encoding: encoding)
    rescue CSV::MalformedCSVError => e
      return [ e ]
    end
    if rows.nil? || rows.empty?
      return [ 'Empty CSV' ]
    end

    parsed, errors = Pherastar::PherastarParser.parse(rows)
    new_dataset_model.data = { readings: parsed[:readings], mode: parsed[:mode] }
    new_dataset_model.data_type = 'spectrophotometry'
    new_dataset_model.attachments << { name: file_name, bucket: bucket, key: key }
    errors
  end

  def self.get_csv_string_from_s3(bucket, key)
    csv_str = StringIO.new('', 'r+')
    S3Helper.instance.client.get_object(bucket: bucket, key: key) do |chunk|
      csv_str.write(chunk)
    end
    csv_str.string
  end

  def self.smr3_from_data(new_dataset_model, bucket, key, file_name)
    csv_str = get_csv_string_from_s3(bucket, key)

    encoded_csv_str = csv_str.force_encoding('iso-8859-1').encode('utf-8')
    encoding = Encoding::UTF_8
    rows = nil
    begin
      rows = CSV.parse(encoded_csv_str, encoding: encoding)
    rescue CSV::MalformedCSVError => e
      return [ e ]
    end
    if rows.nil? || rows.empty?
      return [ 'Empty CSV' ]
    end

    parsed, errors = Smr::Smr3Parser.parse(rows)
    new_dataset_model.data = { readings: parsed[:readings], ref_id: parsed[:ref_id], order_id: parsed[:order_id] }
    new_dataset_model.data_type = 'file'
    new_dataset_model.attachments << { name: file_name, bucket: bucket, key: key }
    errors
  end

  # Save a Dataset from the raw data uploaded to PrimeDirective
  def self.qpcr_from_data(new_model, bucket, key, file_name)
    new_model.data_type = "qpcr"

    # Save original data as an attachment
    new_model.attachments << { name: file_name, bucket: bucket, key: key }

    # Also store on the data field to remain consistent with how TCLE
    # uploads this dataset.
    data_str = S3Helper.instance.read(bucket, upload_key)
    new_model.data = JSON.parse(data_str)
  end

  def find_instruction
    instruction || warp.try(:instruction)
  end

  def self.dataset_attached(dataset)
    # really we should enforce that all datasets come with the instruction id
    # currently TCLE sometimes leaves it off.

    Rails.logger.info("Dataset.dataset_attached with dataset #{dataset.id}"\
                      " - notifying instruction execution manager and run")

    instruction_id = dataset.instruction_id || dataset.warp.try(:instruction_id)
    return unless instruction_id

    instruction = Instruction.find(instruction_id)
    manager     = ExecutionManager.new(instruction.run.referenced_containers)

    Rails.logger.info("Dataset.dataset_attached dataset_id #{dataset.id}, instruction_id #{instruction.id}")

    execution_context = manager.dataset_attached(instruction)
    execution_context.persist_all

    instruction.run.dataset_attached(dataset)
  end

  def is_analysis
    !run_id.nil?
  end

  def metadata
    if data_type == 'file'
      attachment = attachments.first
      if attachment.nil?
        return nil
      end

      S3Helper.instance.metadata(attachment['bucket'], attachment['key'])
    else
      read_attribute(:metadata)
    end
  end

  def parent_run_id
    # NOTE: The `run_id` field refers to the dataset being generated from a run (and not an instruction), while the
    #       `parent_run_id` field here refers to the run which the dataset belongs to.
    self.run_id || self.run.id
  end

  def parent_project_id
    # NOTE: Since 2018, we stopped auto-attaching the project_id directly to datasets. Unclear why, but this is a
    #       workaround for now which is required for downstream views such as RunDatumPage.
    self.project_id || self.run.project_id
  end

  def self.full_json
    {
      only: [
        :id,
        :analysis_tool,
        :analysis_tool_version,
        :attachments,
        :created_at,
        :data_type,
        :deleted_at,
        :instruction_id,
        :parameters,
        :run_id,
        :title,
        :uploaded_by,
        :warp_id
      ],
      methods: [ :supported_formats, :metadata ],
      include: {
        container: Container.aliquots_json,
        device: Device.short_json,
        warp: {
          only: [ :id, :device_id, :created_at, :completed_at, :operator_note, :state, :command ],
          methods: [],
          include: {}
        },
        instruction: {
          only: [ :id, :operation, :executed_at, :completed_at ],
          methods: [],
          include: {
            run: Run.mini_json
          }
        },
        project: Project.mini_json
      }
    }
  end

  def self.short_json
    {
      only: [
        :id,
        :analysis_tool,
        :analysis_tool_version,
        :attachments,
        :created_at,
        :data_type,
        :deleted_at,
        :description,
        :instruction_id,
        :run_id,
        :title,
        :uploaded_by,
        :warp_id,
        :metadata
      ],
      methods: [ :is_analysis ],
      include: {}
    }
  end

  def self.short_with_parent_ids_json
    {
      only: [
        :id,
        :analysis_tool,
        :analysis_tool_version,
        :attachments,
        :created_at,
        :data_type,
        :deleted_at,
        :description,
        :instruction_id,
        :run_id,
        :title,
        :uploaded_by,
        :warp_id
      ],
      methods: [ :parent_run_id, :parent_project_id ],
      include: {}
    }
  end

  def serializable_hash(opts = {})
    opts = Dataset.full_json.merge(opts || {})
    super(opts)
  end

  def self.get_csv_from_qpcr_data(postprocessed_data, refname)
    csv_data = []
    base_header = [ 'Refname', 'Well', 'Curve', 'Dye' ]

    # find first amp and melt curves if they exist
    amp_curve_key = postprocessed_data.keys.find { |k| k =~ /amp/ }
    melt_curve_key = postprocessed_data.keys.find { |k| k =~ /melt/ }
    amp_curve = postprocessed_data[amp_curve_key]
    melt_curve = postprocessed_data[melt_curve_key]

    amp_header =
      if amp_curve
        # amp curve is a mapping from DYE => data. There should be only one DYE, usually FAM
        curve_fit = amp_curve.values[0]['baseline_subtracted_curve_fit']

        # curve fit is a mapping from WellIndex -> datapoints.  We take an arbitrary index to find cycles.
        num_cycles = curve_fit.values[0].size

        # create a column per amp cycle
        [ 'CT' ] + Array.new(num_cycles) { |i| "Cycle #{i + 1}" }
      else
        []
      end

    melt_header =
      if melt_curve
        # mapping from wellIndex -> data
        adjusted_temps = melt_curve.values[0]['adjusted_temps']

        # create a column per melt temperature
        adjusted_temps.map { |t| "#{t.round(2)}°C" }
      else
        []
      end

    # append header
    header = base_header + amp_header + melt_header
    csv_data << header

    postprocessed_data.each do |curve, dyes|
      dyes.each do |dye_name, dye_data|
        case curve
        when /^amp/
          key = 'baseline_subtracted_curve_fit'

          # Cast keys to integer
          dye_data[key] = Hash[
            dye_data[key].keys.map(&:to_i)
                         .zip(dye_data[key].values)
          ]
          dye_data[key].sort.each do |well_idx, rfus|
            ct = dye_data['cts'][well_idx.to_s].try(:round, 2) || ''
            rounded_rfus = rfus.map { |x| x.round(2) }
            row = [ refname, well_idx, curve, dye_name ] + [ ct ] + rounded_rfus + Array.new(melt_header.size, '')

            csv_data << row
          end
        when /^melt/
          key = 'melt_peak_data'
          dye_data[key] = Hash[
            dye_data[key].keys.map(&:to_i)
                         .zip(dye_data[key].values)
          ]

          # Cast keys to integer
          dye_data[key].sort.each do |well_idx, rfus|
            rounded_rfus = rfus.map { |x| x.round(2) }
            row = [ refname, well_idx, curve, dye_name ] + Array.new(amp_header.size, '') + rounded_rfus

            csv_data << row
          end
        end
      end
    end

    csv_data
  end
end
