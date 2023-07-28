class Batch < ApplicationRecord
  has_snowflake_id('bat')
  acts_as_paranoid
  audited

  PRODUCT_TYPE = { final_product: 'FINAL_PRODUCT', intermediate_product: 'INTERMEDIATE_PRODUCT' }.freeze

  belongs_to :organization
  belongs_to :compound_link
  belongs_to :user, foreign_key: :created_by
  has_one :compound, through: :compound_link
  has_and_belongs_to_many :aliquots_compound_links, class_name: :AliquotCompoundLink,
                          association_foreign_key: :aliquots_compound_link_id
  has_many :aliquots, :through => :aliquots_compound_links
  has_many :contextual_custom_properties, as: :context
  has_many :containers, :through => :aliquots
  has_one :synthesis_program_item, as: :item
  has_one :synthesis_program, through: :synthesis_program_item
  has_one :synthesis_request_batch
  has_one :synthesis_request, through: :synthesis_request_batch
  has_many :run_batches
  has_many :runs, through: :run_batches

  validates_uniqueness_of :organization_id, :scope => [ :compound_link, :reaction_id ],
   :message => ', CompoundLink and Reaction already exists .'

  validates :product_type, inclusion: { in: PRODUCT_TYPE.values }
  validates :compound_link, presence: true
  validates :organization, presence: true
  validate :compound_link_org, on: :create
  validate :created_by_user, if: :will_save_change_to_created_by?

  after_update_commit do
    if self.aliquots_compound_links.present? && self.samples_created_at.nil?
      self.samples_created_at = DateTime.now
      self.save!
    end
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def compound_link_org
    unless CompoundServiceFacade::GetCompounds.call(
      { compound_link_ids: compound_link_id, organization_id: [ organization_id, nil ] },
      CompoundServiceFacade::Scope::ALL
    ).exists?
      errors.add(:compound, "#{compound_link_id} does not belong to organization #{organization_id}")
    end
  end

  def created_by_user
    if User.where(id: created_by).joins(:organizations).where(organizations: { id: organization_id }).empty?
      errors.add(:user, "Invalid")
    end
  end

  def run_count
    self.runs.count
  end

  scope :where_ccp, lambda { |ccp_key, ccp_value|
    batch_ids = ContextualCustomProperty.joins("JOIN contextual_custom_properties_configs
          ON contextual_custom_properties_configs.key = '#{ccp_key}' AND
          contextual_custom_properties.contextual_custom_properties_config_id=contextual_custom_properties_configs.id
          AND contextual_custom_properties.value = '#{ccp_value}'").pluck :context_id
    where(id: batch_ids)
  }
end
