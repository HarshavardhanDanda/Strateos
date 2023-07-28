class CompoundService

  def self.create_compounds(compounds)
    created_compounds = []

    # Remove nil and {} compounds
    compounds = compounds.reject { |compound| compound.dig(:attributes, :compound).blank? }

    unless compounds.empty?
      # excluding additional compound properties not required in walter service to create compounds
      excluded_fields = [ :cas_number, :pub_chem_id, :mfcd_number ]
      compound_identifiers = compounds.map { |r|
        r.dig(:attributes, :compound).except(*excluded_fields) if r.dig(:attributes, :compound).key?(:smiles)
      }.compact.uniq
      walter_response = self.summarize_compounds(compound_identifiers)

      request = compounds.map { |r| r.dig(:attributes, :compound) }.uniq
      walter_response.each_with_index do |json, index|
        json['pub_chem_id'] = request[index][:pub_chem_id]
        json['cas_number'] = request[index][:cas_number]
        json['mfcd_number'] = request[index][:mfcd_number]
        compound = build_compound(json)
        begin
          compound.save!
        rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => e
          existing_compound = Compound.find_by(smiles: compound.smiles)
          if existing_compound.present?
            compound = existing_compound
          else
            Rails.logger.error(e.message)
          end
        rescue StandardError => e
          Rails.logger.error(e.message)
        end
        created_compounds.append(compound)
      end
    end

    created_compounds
  end

  def self.summarize_compounds(compound_identifiers)
    summarized_compounds = []

    # Remove nil and {} compounds
    compound_identifiers = compound_identifiers.reject(&:blank?)

    unless compound_identifiers.empty?
      walter_response = WALTER_SERVICE.summarize_compound(compound_identifiers)

      walter_response.each do |json|
        summarized_compounds.append(build_compound(json))
      end
    end

    summarized_compounds
  end

  # Search for similar compounds
  #
  # @param compound [Compound] A { 'smiles': '..' }
  # @param threshold [Number] The minimum similarity acceptance. 1.0 is max
  # @param org_ids [Array<String>] The orgs we are searching in, or public if nil
  # @param include_public [Boolean] Include public compound as well
  #
  # @return [Array<Hash>] [{compound: compound, score: score, smiles: smiles}]
  def self.search(compound, threshold: nil, org_ids: [], include_public: true)
    if threshold.nil?
      threshold = 0.7
    end

    resp = Compound.similarity_search(
      compound[:smiles],
      org_ids,
      threshold,
      include_public
    )

    # return array of {compound, score}
    resp.pluck('compound_id', 'search_score', 'smiles',
               'compound_link_id').map do |compound_id, search_score, smiles, compound_link_id|
      { compound: compound_id, score: search_score, smiles: smiles, compound_link_id: compound_link_id }
    end
  end

  def self.build_compound(compound_json)
    # early return compound if already exists
    compound = Compound.find_by(smiles: compound_json["smiles"])
    return compound if compound

    Compound.new(
      clogp:                  compound_json["clogp"],
      formula:                compound_json["formula"],
      inchi:                  compound_json["inchi"],
      inchi_key:              compound_json["inchi_key"],
      molecular_weight:       compound_json["molecular_weight"],
      exact_molecular_weight: compound_json["exact_molecular_weight"],
      morgan_fingerprint:     compound_json["morgan_fingerprint"],
      sdf:                    compound_json["sdf"],
      smiles:                 compound_json["smiles"],
      tpsa:                   compound_json["tpsa"],
      pub_chem_id:            compound_json["pub_chem_id"],
      mfcd_number:            compound_json["mfcd_number"],
      cas_number:             compound_json["cas_number"]
    )
  end
end
