class Compound < ApplicationRecord
  include ActiveModel::Dirty

  audit_trail

  has_many :compound_links
  has_many :resources
  before_save :add_mol_and_mf
  has_many :batches, :through => :compound_links

  validates_uniqueness_of :smiles, :allow_nil => false
  validates_uniqueness_of :cas_number, :allow_nil => true
  validates_uniqueness_of :mfcd_number, :allow_nil => true
  # From https://www.cas.org/support/documentation/chemical-substances/checkdig
  # A CAS Registry Number includes up to 10 digits which are separated into 3 groups by hyphens.
  # The first part of the number, starting from the left, has 2 to 7 digits; the second part has 2 digits.
  # The final part consists of a single check digit.
  validates_format_of :cas_number, with: /\A\d{2,7}-\d{2}-\d\Z/, :allow_nil => true
  # MFCD Number has a format starting with 'MFCD' followed by 8 digits
  validates_format_of :mfcd_number, with: /\A(MFCD[0-9]{8})\Z/, :allow_nil => true

  scope :minimal_properties, -> { select [ :id, :smiles, :molecular_weight ] }

  HAZARDS = Set.new([
                      'unknown',
                      'flammable',
                      'oxidizer',
                      'strong_acid',
                      'water_reactive_nucleophile',
                      'water_reactive_electrophile',
                      'general',
                      'peroxide_former',
                      'strong_base'
                    ])

  # Perform a similarity search to retrieve similar compounds
  # to the provided compound
  # @return a Compound ActiveRecord::Relation
  def self.similarity_search(smiles_str, org_ids, threshold, public)
    # Generate Compounds with a field storing their score against the provided smiles
    # _TODO_ do we need to select all attrs of compound?
    tanimoto_sml = sanitize_sql_for_assignment([ "tanimoto_sml(morganbv_fp(:smiles), morgan_fingerprint_bfp)", {
      smiles: smiles_str
    } ])

    if org_ids.empty? and !public
      raise ActiveRecord::StatementInvalid
    end

    org_filter = ""

    unless org_ids.empty?
      org_filter = "compound_links.organization_id IN (#{org_ids.map { |id|
        sanitize_sql_for_assignment([ ':id', { id: id } ])
      }.join(',')})"
    end

    if public
      org_filter = if org_filter != ""
                     "(#{org_filter} OR compound_links.organization_id is NULL)"
                   else
                     "compound_links.organization_id is NULL"
                   end
    end

    sml_threshold = sanitize_sql_array([ "tanimoto_score>=:threshold", { threshold: threshold } ])

    if org_filter != ""
      sml_threshold = " AND #{sml_threshold}"
    end

    sql = "
      WITH
      similarity_scores AS (
          SELECT id,  #{tanimoto_sml} AS tanimoto_score, smiles
          FROM compounds
      )
      SELECT compound_id, tanimoto_score as search_score, smiles, compound_links.id as compound_link_id
      FROM compound_links
      JOIN similarity_scores
      ON compound_id = similarity_scores.id
      WHERE #{org_filter}#{sml_threshold} ORDER BY tanimoto_score DESC;
    "

    similar_compounds = ActiveRecord::Base.connection.execute(sql)

    similar_compounds
  end

  # A walter compound can be specified with XOR of smiles/inchi/sdf
  # Arbitrarily choose smiles
  def as_walter_json
    { smiles: self.smiles }
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [ :public_compound_name ] }
  end

  def public_compound_name
    CompoundLink.public_only&.where(compound_id: self.id).first&.name
  end

  def no_flags
    self.existing_flags.empty?
  end

  def existing_flags
    result = []

    HAZARDS.each do |flag|
      if self[flag]
        result << flag
      end
    end
    return result
  end

  def add_mol_and_mf
    if self.smiles_changed?
      if self.smiles == ""
        raise ActiveRecord::StatementInvalid
      end

      sql = ActiveRecord::Base.sanitize_sql_for_conditions(
        [
          "SELECT morganbv_fp(:smiles) AS morgan_fingerprint_bfp, mol_from_smiles(:smiles) AS mol",
          { smiles: self.smiles }
        ]
      )
      query = ActiveRecord::Base.connection.execute(sql)
      self.mol = query.pluck('mol').first
      self.morgan_fingerprint_bfp = query.pluck('morgan_fingerprint_bfp').first
    end
  end
end
