# Form generator for Sanger Sequence instruction specifically for the Eton third-party vendor to execute sanger_sequence
# instructions. http://www.etonbio.com. The form generated here is meant to be ingested through Eton's order website
# under the 96 Well Plate format. Must be Excel format
#
# The generator attempts to handle the cases in which the aliquot properties needed to generate the form are either in
# out_section of the run, i.e. a run containing handling instructions combined with the sanger sequence instructions and
# the container is to be created upon execution / completion of the run, and the case where the sanger sequence
# instructions reference containers that have already been created and the aliquot properties have been populated. In
# the scenario, where aliquot properties are created and the out_section exists, the aliquot's properties will take
# precedent allowing for the operator to override the properties.
module EsaGenerators
  module SangerSequenceEton

    REQUIRED_SANGER_SEQUENCE_ALIQUOT_PROPERTY_KEYS =
      %w[target_construct_name target_construct_sequence dna_concentration primer_name]

    # "Notes" isn't used by the vendor and is only for additional information to the operator
    FORM_HEADERS = [ "Plate", "Well Position", "SampleID", "Sample Name", "Primer", "Notes" ]

    VENDOR = 'Eton'

    # Main entry point for generation
    #
    # @param run the run to generate an esa for
    # @param instructions the instructions to generate an esa for and will be associated to the generated esa
    #
    # @raise ArgumentError, RuntimeError
    def self.generate(run, instructions)

      Rails.logger.info(
        "[ESA] Generating #{instructions.first.op} ESA for Eton. Run: #{run.id}, "\
        "Instructions: #{instructions.pluck(:id)}"
      )

      ref_name_to_ap_wells = generate_ref_name_to_ap_wells_map(instructions)
      refs = Ref.includes(container: [ :container_type, { aliquots: [ :container ] } ])
                .where(name: ref_name_to_ap_wells.keys, run_id: run.id)

      validate_refs(refs, ref_name_to_ap_wells.keys)

      ref_to_merged_well_maps = generate_merged_ref_to_wells_map(ref_name_to_ap_wells, refs, run)
      ref_to_found_keys_wells_map = get_found_keys_ref_to_wells_map(ref_to_merged_well_maps)
      data_rows = generate_data_rows(ref_to_found_keys_wells_map, ref_to_merged_well_maps, run)

      prev_generated_count = ExecutionSupportArtifact.where(run_id: run.id, vendor: VENDOR.downcase)
                                                     .with_instructions(instructions.pluck(:id))
                                                     .load.size

      # Create XLSX form
      xlsx_data = nil
      workbook = nil
      begin
        workbook = FastExcel.open
        worksheet = workbook.add_worksheet()

        # Header and data start on row 2
        worksheet.write_row(2, FORM_HEADERS)
        data_rows.each do |row|
          worksheet << row
        end
      rescue ArgumentError => e
        Rails.logger.error("[ESA] Error during Excel creation. Error: #{e.inspect}")
        raise e
      ensure
        # Reading the string closes the workbook
        xlsx_data = workbook.read_string if workbook&.is_open
      end

      # Build ESA and upload XLSX form to S3
      esa = run.execution_support_artifacts.build(operation: instructions.first.op)
      esa.instructions = instructions
      esa.id = ExecutionSupportArtifact.generate_snowflake_id
      esa.name = "Eton_v#{prev_generated_count + 1}.xlsx"
      esa.vendor = VENDOR.downcase

      bucket, key = S3Helper.instance.safe_write_string(xlsx_data, S3_ESA_BUCKET, esa.id, esa.name)

      esa.s3_bucket = bucket
      esa.s3_key = key
      esa.status = "generated"

      esa
    end

    class SangerSequenceEtonGeneratorError < StandardError
    end

    class MissingRefsError < SangerSequenceEtonGeneratorError
      def initialize(instruction_refs, refs)
        @instruction_refs = instruction_refs
        @refs = refs
      end

      def message
        I18n.t "errors.esa_generation.sanger_sequence_eton.missing_refs",
               :instruction_refs => @instruction_refs, :refs => @refs
      end
    end

    class MissingPropertiesError < SangerSequenceEtonGeneratorError
      def initialize(missing_properties_map)
        @missing_properties_map = missing_properties_map
      end

      def message
        I18n.t "errors.esa_generation.sanger_sequence_eton.missing_properties", :map => @missing_properties_map
      end
    end

    class InvalidContainerTypesError < SangerSequenceEtonGeneratorError
      def initialize(ref_to_invalid_container_type_map)
        @ref_to_invalid_container_type_map = ref_to_invalid_container_type_map
      end

      def message
        I18n.t "errors.esa_generation.sanger_sequence_eton.invalid_container_types",
               :invalid_refs => @ref_to_invalid_container_type_map
      end
    end

    private

    # Verifies that all the refs in the instructions all exist and that the container_types are either single vials
    # or 96 well plates
    def self.validate_refs(refs, ap_ref_names)
      # This really shouldn't happen
      raise MissingRefsError, ap_ref_names, refs.pluck(:name) if ap_ref_names.size != refs.size

      invalid_container_types = refs.filter_map { |ref|
        container_type = ref.container_type
        [ ref.name, container_type ] if [ 1, 96 ].exclude? container_type.well_count
      }

      raise InvalidContainerTypesError, invalid_container_types unless invalid_container_types.empty?
    end

    # Generates the data rows according to the Eton form format
    def self.generate_data_rows(ref_to_found_keys_wells_map, ref_to_merged_well_maps, run)
      plate_count = 0
      sample_count = 0

      data_rows = []

      organization_id = run.project.organization_id

      ref_to_found_keys_wells_map.each do |ref, wells_map|
        plate_count += 1
        container_type = ref.container_type
        wells_map.keys.sort_by(&:to_i).each do |well_idx|
          sample_count += 1

          well_properties = wells_map[well_idx]
          row_idx, col_idx = container_type.robot_well_array(well_idx)
          padded_human_well = container_type.row_idx_to_letters(row_idx) + format("%02d", (col_idx + 1))

          instruction_id = ref_to_merged_well_maps[ref][well_idx]['instruction_id']
          primer_name = well_properties['primer_name']
          sample_name =
            "#{organization_id}_#{instruction_id}_#{well_properties['target_construct_name']}_#{primer_name}"
          seq_length = well_properties['target_construct_sequence'].length
          notes = "sequence_length:#{seq_length};dna_concentration:#{well_properties['dna_concentration']};"
          notes += "barcode:#{ref.container.barcode}" if ref.container.present?

          # ["Plate", "Well Position", "SampleID", "Sample Name", "Primer", "Notes"]
          data_rows << [ plate_count.to_s, padded_human_well, sample_count.to_s, sample_name, primer_name, notes ]
        end
      end
      data_rows
    end

    # Filter Aliquots according to the AP Instruction refs and wells, generate a wells property map from the aliquots,
    # and deep merge with the base containing the instruction_id property whose well_idx have been converted to robot
    # index using the ref container_type.
    #
    # Deep merge priority Aliquot properties > Out Section Aliquot properties > Base well map
    #
    # End format:
    #   { "<ref>" =>
    #     { "<well_idx>" =>
    #       { "instruction_id" => "i1234",
    #         "<out_section_property>" => "value",
    #         "<aq_property>" => "value",
    #         ...
    #       },
    #       ...
    #     },
    #     ...
    #   }
    def self.generate_merged_ref_to_wells_map(ref_name_to_ap_wells, refs, run)
      out_section_filtered = run.out_section.slice(*ref_name_to_ap_wells.keys)

      refs.map { |ref|
        container_type = ref.container_type
        well_to_base_properties =
          ref_name_to_ap_wells.fetch(ref.name, {}).transform_keys { |well| container_type.robot_well(well).to_s }

        out_aq_properties =
          out_section_filtered&.[](ref.name)&.transform_values { |value| value.fetch('properties', {}) } || {}

        filtered_aliquots =
          ref.container&.aliquots&.filter do |aq|
            well_to_base_properties.keys.include? container_type.robot_well(aq.well_idx).to_s
          end || []
        filtered_aliquots_map = filtered_aliquots.map { |aq| [ aq.well_idx.to_s, aq.properties ] }.to_h

        merged_aq_properties = well_to_base_properties.deep_merge(out_aq_properties).deep_merge(filtered_aliquots_map)
        [ ref, merged_aq_properties ]
      }.to_h
    end

    # Create base ref_to_wells_map inserting a property called `instruction_id` for each sample. This follows a format
    # similar to the Run.out_section to enable Hash deep_merges
    #
    # End Format:
    #   { "<ref_name>" => { "well_name" => { "instruction_id" => "i1234" } } }
    def self.generate_ref_name_to_ap_wells_map(instructions)
      ap_instructions_to_instruction_id = instructions.map { |instruction| [ instruction.parsed, instruction.id ] }.to_h

      ap_instructions_to_instruction_id
        .group_by { |ap_instruction, _instruction_id| ap_instruction.object }
        .transform_values(&:to_h)
        .map { |ref, ap_instruction_to_instruction_id|

          well_to_properties = ap_instruction_to_instruction_id.flat_map { |ap_inst, instruction_id|
            ap_inst.wells.map { |well| [ well, { "instruction_id" => instruction_id } ] }
          }.to_h

          [ ref, well_to_properties ]
        }.to_h
    end

    # Verify that all required keys exist in the merged property map per ref / aliquot index and generate both a map
    # containing the found keys and a map of the missing ones used to throw an error to the user
    #
    # End Format:
    #  ref_to_updated_wells_map =
    #   { "<ref>" =>
    #     { "<well_idx>" => <found_required_properties> },
    #     ...
    #   }
    #
    #  ref_to_wells_missing_keys_map =
    #   { "<ref>" =>
    #     { "<well_idx>" =>
    #       { "missing_keys" => [<missing_required_keys>] },
    #       ...
    #     },
    #     ...
    #   }
    # @param ref_to_merged_well_maps the ref_to_wells_map data structure whose properties are merged from out_section
    #                                and aliquot properties
    # @raise MissingPropertiesError
    def self.get_found_keys_ref_to_wells_map(ref_to_merged_well_maps)
      ref_to_updated_wells_map, ref_to_wells_missing_keys_map = ref_to_merged_well_maps.map { |ref, wells_map|
        updated_wells, missing_keys_wells = wells_map.map { |well_idx_key, properties|

          out_found_keys, out_missing_keys =
            REQUIRED_SANGER_SEQUENCE_ALIQUOT_PROPERTY_KEYS.partition { |key| properties&.include? key }

          updated_well_props = [ well_idx_key, properties.slice(*out_found_keys) ] unless out_found_keys.empty?
          well_missing_keys =
            [ well_idx_key, [ [ "missing_keys", out_missing_keys ] ].to_h ] unless out_missing_keys.empty?

          [ updated_well_props, well_missing_keys ]

        }.transpose.map(&:compact).map(&:to_h)

        ref_updated_wells = [ ref, updated_wells ] unless updated_wells.empty?
        ref_wells_missing_keys = [ ref, missing_keys_wells ] unless missing_keys_wells.empty?

        [ ref_updated_wells, ref_wells_missing_keys ]

      }.transpose.map(&:compact).map(&:to_h)

      raise MissingPropertiesError,
            ref_to_wells_missing_keys_map.transform_keys(&:name) unless ref_to_wells_missing_keys_map.empty?

      ref_to_updated_wells_map
    end
  end
end
