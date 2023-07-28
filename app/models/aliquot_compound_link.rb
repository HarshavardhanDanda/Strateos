# Join model for Aliquots <=> CompoundLinks many to many association
class AliquotCompoundLink < ApplicationRecord
  DSL = Autoprotocol::Schema::DSL

  audit_trail

  def generate_audit_trail_header_message(event_type)
    params = {
      class_name: 'Aliquot', # we don't want the customer to see Aliquot compound link in description
      id: aliquot.id
    }

    I18n.t(
      event_type.parameterize.to_sym,
      scope: :audit_trail,
      **params,
      default: DEFAULT_AUDIT_MESSAGES[event_type]
    )
  end

  def translate_audit_trail_attributes
    audit_trail_columns = self.class.audit_trail_columns
    before_attrs_map = transaction_changed_attributes
    changed_attr_keys = before_attrs_map.slice(*audit_trail_columns).keys

    changed_attr_keys.map do |attr|
      if attr == 'm_moles'
        aliquot_volume = aliquot.volume_ul
        old_conc = AliquotCompoundLink.calculate_concentration_from_milli_moles(before_attrs_map[attr], aliquot_volume)
        new_conc = AliquotCompoundLink.calculate_concentration_from_milli_moles(attributes[attr], aliquot_volume)
        "Concentration: ['#{old_conc}', '#{new_conc}']"
      else
        "#{self.class.human_attribute_name(attr)}: ['#{before_attrs_map[attr]}', '#{attributes[attr]}']"
      end
    end
  end

  self.table_name = :aliquots_compound_links

  belongs_to :aliquot
  belongs_to :compound_link
  has_and_belongs_to_many :batches, association_foreign_key: :batch_id, foreign_key: :aliquots_compound_link_id
  validates :aliquot, presence: true, uniqueness: { scope: :compound_link }
  validates :compound_link, presence: true
  validate :validates_orgs_match, unless: -> { aliquot.nil? || compound_link.nil? }
  validates :m_moles, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Ensure that the organizations for the container containing the aliquot and the compound link associated to the
  # aliquot match. A bug was found where the container's aliquots were assigned a cross org compound link.
  def validates_orgs_match
    unless self.compound_link.is_public?
      if self.aliquot.container.organization != self.compound_link.organization
        error_message = "Aliquot's organization: #{self.aliquot.container.organization.id} does not match " \
                        "compound_link's organization: #{self.compound_link.organization.id}"
        errors.add :aliquots_compound_links, error_message
      end
    end
  end

  MOLAR_CONCENTRATION_SCHEMA = Autoprotocol::Schema::DSL.build do
    MolarConcentration()
  end

  MILLI_MICRO_MOLAR_CONCENTRATION_SCHEMA = Autoprotocol::Schema::DSL.build do
    MolarConcentration('millimole/microliter')
  end

  VOLUME_SCHEMA = Autoprotocol::Schema::DSL.build do
    Volume()
  end

  # It won't set m_moles based on concentration if it is solid aliquot
  def concentration=(conc)
    unless self.aliquot.is_solid_aliquot?
      aliquot_volume = self.aliquot.volume_ul
      write_attribute(:m_moles, AliquotCompoundLink.calculate_millimoles_from_concentration(conc, aliquot_volume))
    end
  end

  def concentration
    aliquot_volume = self.aliquot.volume_ul
    AliquotCompoundLink.calculate_concentration_from_milli_moles(self.m_moles, aliquot_volume)
  end

  def self.flat_json
    { only: [ :id, :aliquot_id, :compound_link_id, :solubility_flag ],
      include: {
        compound_link: CompoundLink.flat_json
      }, methods: [ :concentration ] }
  end

  def self.calculate_millimoles_from_mass(aliquot_mass, compound_molecular_weight)
    if aliquot_mass.present? && compound_molecular_weight.present? && compound_molecular_weight.nonzero?
      aliquot_mass / compound_molecular_weight
    end
  end

  def self.calculate_millimoles_from_concentration(concentration, aliquot_volume)

    milli_moles_count = nil

    if aliquot_volume.present? && concentration.present?
      concentration_parsed = MILLI_MICRO_MOLAR_CONCENTRATION_SCHEMA.parse("#{concentration}:millimole/liter")
      volume_parsed = VOLUME_SCHEMA.parse("#{aliquot_volume}:microliter")

      # concentration unit is mM (mMoles/litre) and aliquot vol is in micro litre
      milli_moles_count = concentration_parsed.value * volume_parsed.value
    end

    return milli_moles_count
  end

  def self.calculate_concentration_from_milli_moles(m_moles, aliquot_volume)
    concentration = nil

    if (aliquot_volume.present? && m_moles.present?)

      milli_moles_per_liter_parsed = MOLAR_CONCENTRATION_SCHEMA.parse("#{m_moles / aliquot_volume.to_f}"\
                                                                      ":millimole/microliter")

      concentration = milli_moles_per_liter_parsed.value

    end

    return concentration
  end

end
