class ParseLcmsData

  def self.is_first_level(file_name)
    dir_name = File.dirname(file_name)
    dir_name == '.'
  end

  def self.get_fractions_from_xml(xml)
    parsed_body = Hash.from_xml(xml)
    Array.wrap(parsed_body&.dig('Results', 'UserData', 'Analysis', 'Fractions', 'Fraction'))
  end

  def self.parse_lcms_xml(xml, dataset)
    # parse the entire xml
    parsed_doc = Nokogiri::XML(xml)
    analysis_type = parsed_doc.xpath("//Results/UserData/Analysis")&.attribute('type')&.value
    case analysis_type
    when 'DegradationAnalysis'
      return parse_degradation_analysis(parsed_doc), analysis_type
    when 'ReactionMonitoring'
      return parse_reaction_monitoring_analysis(parsed_doc), analysis_type
    when 'FractionAnalysis'
      return parse_fraction_analysis(parsed_doc, dataset), analysis_type
    when 'FractionSelection'
      return parse_fraction_selection_analysis(parsed_doc), analysis_type
    else
      raise "Unknown lcms analysis type: #{analysis_type}"
    end
  end

  def self.parse_degradation_analysis(parsed_doc)
    # check whether there are exception messages field in parsed doc
    # if so, grab values from exception message
    # else, continue regularly
    da_exceptions = parsed_doc.xpath("//Exceptions")
    exception_message = get_attribute_value(da_exceptions.xpath(".//AcceptanceException/Message").text.strip)
    if exception_message != "N/A"
      da_analysis_results =
        [ {
          purity: exception_message.match(/Purity = (\d+\.\d+)/)[1],
          rt: "retention time has shifted",
          purity_code: exception_message.match(/Purity Code of ([ABCDF])/)[1],
          barcode: get_attribute_value(da_exceptions.xpath(".//AcceptanceException/SampleData/Barcode").text.strip)
        } ]
    else
      results = parsed_doc.xpath("//Result")
      da_analysis_results = results.map do |result|
        {
          purity: get_attribute_value(result.xpath("Purity").text.strip),
          rt: get_attribute_value(result.xpath("Rt").text.strip),
          purity_code: get_attribute_value(result.attribute("purityCode")&.value),
          barcode: get_attribute_value(result.attribute("barcode")&.value)
        }
      end
    end

    da_analysis_data = {
      results: da_analysis_results,
      sample_id: get_attribute_value(parsed_doc.xpath("//SampleId")[0].text.strip),
      method_name: get_attribute_value(parsed_doc.xpath("//Method").text.strip)
    }
    da_analysis_data
  end

  def self.get_attribute_value(value)
    return "N/A" unless value.present?
    value
  end

  def self.parse_reaction_monitoring_analysis(parsed_doc)
    isobars = parsed_doc.xpath("//Isobar")
    rm_analysis_isobars = isobars.map do |isobar|
      is_isobar_number_present = isobar.children.length > 0 && isobar.children[0].class == Nokogiri::XML::Text
      {
        isobar: is_isobar_number_present ? get_attribute_value(isobar.children[0].text.strip) : 'N/A',
        signal_alias: get_attribute_value(isobar.xpath("SignalAlias").text.strip),
        centroid: get_attribute_value(isobar.xpath("Centroid").text.strip),
        height: get_attribute_value(isobar.xpath("Height").text.strip),
        area_abs: get_attribute_value(isobar.xpath("AreaAbs").text.strip),
        area_perc: get_attribute_value(isobar.xpath("AreaPerc").text.strip),
        absolute_amt_coi: get_attribute_value(isobar.xpath("AbsoluteAmtCOI").text.strip),
        isobar_relative_amt_coi: get_attribute_value(isobar.xpath("IsobarRelativeAmtCOI").text.strip),
        bpm_pos: get_attribute_value(isobar.xpath("BPMPos").text.strip),
        bpm_neg: get_attribute_value(isobar.xpath("BPMNeg").text.strip)
      }
    end
    rm_analysis_data = {
      isobars: rm_analysis_isobars,
      sample_id: get_attribute_value(parsed_doc.xpath("//SampleId").text.strip),
      method_name: get_attribute_value(parsed_doc.xpath("//Method").text.strip)
    }
    rm_analysis_data
  end

  def self.parse_fraction_selection_analysis(parsed_doc)
    fractions = parsed_doc.xpath("//Fraction")
    fs_analysis_fractions = fractions.map do |fraction|
      {
        group: get_attribute_value(fraction.attribute('group')&.value),
        source_barcode: get_attribute_value(fraction.attribute('injectionBarcode')&.value),
        fraction_barcode: get_attribute_value(fraction.attribute('tubeLocation')&.value),
        fraction_volume: get_attribute_value(fraction.attribute('volume')&.value),
        command: get_attribute_value(fraction.attribute('command')&.value)
      }
    end
    fs_analysis_data = {
      fractions: fs_analysis_fractions,
      sample_id: get_attribute_value(parsed_doc.xpath('//SampleId').text.strip),
      method_name: get_attribute_value(parsed_doc.xpath('//Method').text.strip),
      message: get_attribute_value(parsed_doc.xpath('//Message').text.strip)
    }
    fs_analysis_data
  end

  def self.parse_fraction_analysis(parsed_doc, dataset)
    fraction_analysis_samples = []
    combined_fractions = parsed_doc.xpath('//CombinedFractions')
    combined_fractions.each do |cf|
      fractions = cf.xpath("Fraction")
      fractions.each do |fraction|
        isobar = cf.xpath("@isobar").text.strip
        fraction_analysis_obj = get_fraction_analysis_object(fraction, isobar, dataset)
        fraction_analysis_samples.push(fraction_analysis_obj)
      end
    end
    single_fractions = parsed_doc.xpath('//SingleFractions')
    single_fractions.each do |sf|
      fractions = sf.xpath("Fraction")
      fractions.each do |fraction|
        isobar = sf.xpath("@isobar").text.strip
        fraction_analysis_obj = get_fraction_analysis_object(fraction, isobar, dataset)
        fraction_analysis_samples.push(fraction_analysis_obj)
      end
    end
    fraction_analysis_data = {
      fractions: fraction_analysis_samples,
      sample_id: parsed_doc.xpath("//SampleId").first.text.strip,
      method_name: parsed_doc.xpath("//Method").first.text.strip
    }
    fraction_analysis_data
  end

  def self.get_fraction_analysis_object(fraction, isobar, dataset)
    amount = fraction.xpath('@amount').text.strip
    command = fraction.xpath('@command').text.strip
    hplc_barcode = fraction.xpath('@barcode').text.strip
    lab = dataset.run.lab
    hplc_container_name = hplc_barcode && Container.find_by(barcode: hplc_barcode, lab: lab.shared_ccs_labs).label
    fraction_number = hplc_container_name && hplc_container_name[0, 2]
    barcode = get_fraction_analysis_barcode(dataset, hplc_barcode)
    fraction_analysis_obj = {
      fraction: fraction_number&.match(/^F+[0-9]$/) ? fraction_number : 'N/A',
      barcode: barcode,
      amount: amount == 'None' ? 'N/A' : amount,
      RT: get_attribute_value(fraction.xpath("@isobarRefRt").text.strip),
      command: get_attribute_value(command),
      isobar: get_attribute_value(isobar)
    }
    if command == 'RunNextMethod'
      fraction_analysis_obj[:nextMethod] = fraction.xpath('@nextMethod').text.strip
    end
    fraction_analysis_obj
  end

  # returns d2 vial's barcode for given hplc barcode and dataset. So first it will find
  # aliquot effect which belongs to same run as this lcms instruction and
  # have affected_container with given hplc barcode, then using that aliquot effect's generating_instruction,
  # it will find the another aliquot effect which will have affected container as d2 vial.
  def self.get_fraction_analysis_barcode(dataset, hplc_barcode)
    instruction_id = dataset.instruction_id
    run_id = Instruction.where(id: instruction_id).pluck(:run_id)
    hplc_container_id = hplc_barcode && Container.where(barcode: hplc_barcode,
                                                        lab: Instruction.find(instruction_id).run.lab.shared_ccs_labs)
                                                 .pluck(:id)
    if run_id.present? && hplc_container_id.present?
      aliquot_effect_data = AliquotEffect.joins("JOIN instructions on
        aliquot_effects.generating_instruction_id = instructions.id").where(
          aliquot_effects: { affected_container_id: hplc_container_id.first },
          instructions: { run_id: run_id.first }
        ).order(created_at: :ASC).first
      hplc_instruction_id = aliquot_effect_data&.generating_instruction_id
      source_container_id = hplc_instruction_id && AliquotEffect.where(generating_instruction_id: hplc_instruction_id)
                                                                .where.not(affected_container_id: hplc_container_id)
                                                                .pluck(:affected_container_id)
      barcode = source_container_id && Container.where(id: source_container_id.first).pluck(:barcode)
      return barcode ? barcode.first : 'N/A'
    end
    return 'N/A'
  end

  # Run conversions for the provided dataset to produce data objects
  def self.convert_lcms_zip_file(dataset)

    if dataset.attachments.empty? || dataset.attachments[0]['key'].nil?
      return
    end

    attachment = dataset.attachments[0]
    s3_stream = S3Helper.instance.read(attachment["bucket"], attachment["key"])

    data = {}
    data_objects = []

    # CREATE DATA OBJECT FOR THE ZIP
    zip_data_object, errors = DatasetConverter.new_data_object_from_attachment(dataset.id, dataset.attachments[0])
    unless errors.empty?
      Rails.logger.warn "Unable to create data object for lcms zip: #{errors}"
      dataset.status = 'converted'
      dataset.conversion_errors = [ "Unable to create data object for lcms zip" ]
      dataset.save!
      return
    end
    zip_data_object.format = DataObject::FILE_FORMAT
    zip_data_object.save!
    data_objects << zip_data_object

    begin
      Zip::Archive.open_buffer(s3_stream) do |ar|
        ar.each do |e|
          base_name = File.basename(e.name)

          if e.name.downcase.ends_with?(".xml") && is_first_level(e.name)
            xml = e.read
            data['Fractions'] = get_fractions_from_xml(xml)
            base_key = "conversions/#{dataset.id}"
            data_objects << DatasetConverter.generate_xml_data_object(dataset, xml, base_key, base_name)
            parsed_lcms_data, analysis_type = parse_lcms_xml(xml, dataset)
            if parsed_lcms_data
              lcms_base_name = "#{base_name.slice(0, base_name.length-3)}json"
              data_objects << DatasetConverter.generate_lcms_data_object(
                dataset, parsed_lcms_data, base_key, lcms_base_name, analysis_type)
            end
          end

          if e.name.downcase.ends_with?(".pdf")
            base_key = "conversions/#{dataset.id}/#{base_name}"
            data_objects << DatasetConverter.generate_pdf_data_object(dataset, e.read, base_key, base_name)
          end
        end

        # run the finalizer on all created data_objects
        data_objects.each do |data_object|
          DataObjectFinalizerJob.new.perform(data_object.id)
        end

        dataset.status = 'converted'
        dataset.data = data
        dataset.save!
      end
    rescue StandardError => e
      Rails.logger.warn "Unable to process LcmsData: #{e}"
      dataset.status = 'converted'
      dataset.conversion_errors = [ "Unable to convert dataset due to: #{e}" ]
      dataset.save!
      return
    end
  end
end
