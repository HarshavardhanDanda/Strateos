class ContextualCustomPropertiesConfig < ApplicationRecord
  CONTEXT_TYPES = [
    "Aliquot",
    "CompoundLink",
    "Container",
    "Run",
    "Batch"
  ]

  has_snowflake_id 'ccpc'

  belongs_to :organization

  CONTEXT_TYPES.each do |context_type|
    scope context_type.underscore.to_sym, lambda {
      where(context_type: context_type)
    }
  end

  validates               :key, presence: true
  validates               :label, presence: true
  validates               :context_type, presence: true
  validates               :organization, presence: true
  validates_uniqueness_of :key, scope: [ :organization_id, :context_type ]

  FULL_JSON = {
    only: [ :id, :context_type, :organization_id, :key, :label, :config_definition, :created_at, :updated_at ],
    include: {},
    methods: []
  }.freeze

  def options
    self.config_definition["options"]
  end

  def option_values
    self.options.map { |option| option["value"] }
  end

  def has_option?(option)
    !self.option_values.nil? ? self.option_values.include?(option["value"]) : false
  end

  def add_options(options_to_add)
    valid_options = options_to_add.select { |option| !self.has_option?(option) }
    old_options = self.options
    new_options = old_options.concat valid_options
    new_config_definition = self.config_definition
    new_config_definition["options"] = new_options
    self.config_definition = new_config_definition
    self.save!
  end
end
