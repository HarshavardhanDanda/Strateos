class CompoundLinkExternalSystemId < ApplicationRecord
  has_snowflake_id('clextid')
  audit_trail

  belongs_to :compound_link
  belongs_to :organization

  validates :compound_link, presence: true, uniqueness: { scope: :organization_id }
  validates :organization, presence: true
  validates :external_system_id, presence: true, uniqueness: { scope: :organization_id }

  def self.upsert(external_system_id, compound_link_id, organization_id)

    compound_link_external_system_id =
      self.find_by(compound_link_id: compound_link_id,
                   organization_id: organization_id)

    if external_system_id.empty?
      if compound_link_external_system_id.present?
        compound_link_external_system_id.destroy!
      end
    else
      if compound_link_external_system_id.nil?
        compound_link_external_system_id =
          self.new(external_system_id: external_system_id, compound_link_id: compound_link_id,
                   organization_id: organization_id)
      else
        compound_link_external_system_id.external_system_id = external_system_id
      end

      compound_link_external_system_id.save!
    end
  end
end
