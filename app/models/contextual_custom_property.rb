class ContextualCustomProperty < ApplicationRecord
  has_snowflake_id 'ccp'

  belongs_to :context, :polymorphic => true
  belongs_to :contextual_custom_properties_config

  validate :validate_type
  validate :validate_regexp
  validate :validate_options

  delegate :config_definition, :key, to: :contextual_custom_properties_config

  def validate_type
    type    = config_definition['type']
    message = "value: [#{value}] does not match type: [#{type}] for key: [#{key}]"
    errors.add(:validate_type, message) unless is_correct_type?(type)
  end

  def validate_regexp
    validation_regexp = config_definition['validation_regexp']
    message           = "value: [#{value}] does not match regexp: [#{validation_regexp}] for key: [#{key}]"
    errors.add(:validate_regexp, message) if !validation_regexp.nil? && !matches_regexp?(validation_regexp)
  end

  def validate_options
    type    = config_definition['type']
    options = config_definition['options']&.map { |op| op['value'] }
    if !options.nil? && !get_invalid_values(options, type).empty?
      errors.add(:validate_options, "values: #{get_invalid_values(options, type)} not in options for key: [#{key}]")
    end
  end

  def serializable_hash(opts = {})
    opts = FULL_JSON.merge(opts || {})
    super(opts)
  end

  def to_hash
    { "#{key}": value }
  end

  private

  def is_correct_type?(type)
    case type
    when 'integer'
      value.to_i.to_s == value
    when 'float'
      value.to_f.to_s == value
    when 'boolean'
      [ 'true', 'false' ].include? value
    else
      true
    end
  end

  def matches_regexp?(regexp_str)
    result = Regexp.new(regexp_str) =~ value
    !result.nil?
  end

  def self.ccps_to_hash(ccps)
    ccps.reduce({}) do |ccp_hash, ccp|
      ccp_hash[ccp.key] = ccp.value
    end
  end

  def get_invalid_values(options, type)
    values = if type == 'multi-choice'
               value.split(";")
             elsif type == 'choice'
               [ value ]
             end

    values.select { |v| !options.include?(v) }
  end

  FULL_JSON = {
    only:    [ :id, :value, :context_id, :context_type ],
    methods: [ :key ]
  }.freeze

  CREATE_SCHEMA = {
    "$schema" => "http://json-schema.org/draft-04/schema#",
    type:     "array",
    items:    {
      type:       "object",
      properties: {
        key:   { type: "string" },
        value: { type: "string" }
      }
    }
  }

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def self.upsert_with_key(key, value, context, org)
    config = ContextualCustomPropertiesConfig.find_by!(
      key:          key,
      organization: org,
      context_type: context.class.name
    )

    ccp       = ContextualCustomProperty.find_or_initialize_by(contextual_custom_properties_config: config,
                                                               context: context)
    ccp.value = value
    ccp.save!
  end
end
