class LaunchRequest < ApplicationRecord
  has_snowflake_id('lr')

  belongs_to :protocol
  belongs_to :user
  belongs_to :organization
  belongs_to :lab
  has_many :runs, dependent: :nullify

  validates_presence_of :lab

  if Rails.env.test?
    after_create :background_job
  else
    after_commit :background_job, on: :create
  end

  def background_job
    ProtocolLaunchJob.perform_async(self.id)
  end

  # Rails cannot process large JSON. Thus the 5 pairs below.
  #
  # Note that you *MUST* use the assignment method for your
  # change to be persisted to the database. Mutating via reference
  # `launch_request.inputs['foo'] = 'bar'` will NOT be saved.
  #
  def inputs=(inputs)
    @inputs = inputs
    super(JSON.generate(inputs))
  end

  def inputs
    @inputs ||= JSON.parse(super)
  end

  def autoprotocol=(autoprotocol)
    @autoprotocol = autoprotocol
    super(JSON.generate(autoprotocol))
  end

  def autoprotocol
    @autoprotocol ||= JSON.parse(super)
  end

  def generation_errors=(generation_errors)
    @generation_errors = generation_errors
    super(JSON.generate(generation_errors))
  end

  def generation_errors
    @generation_errors ||= JSON.parse(super).to_a
  end

  def outputs=(outputs)
    @outputs = outputs
    super(JSON.generate(outputs))
  end

  def outputs
    @outputs ||= JSON.parse(super)
  end

  def raw_input=(raw_input)
    @raw_input = raw_input
    super(JSON.generate(raw_input))
  end

  def raw_input
    @raw_input ||= JSON.parse(super)
  end

  def self.full_json
    {
      only: [ :progress, :generation_errors, :inputs, :outputs, :autoprotocol, :test_mode, :organization_id,
              :input_file_attributes ],
      include: {
        protocol: Protocol.short_json
      }
    }
  end

  def self.inputs_for_parameters(organization, manifest, inputs)
    # TODO: The refs calculation should be removed.
    #
    # Currently, we do all of this calculation to figure out refnames,
    # where ideally the autoprotocol python scripts would be far better
    # suited to choose ref names when the container label is missing.

    # get all container ids from the inputs
    container_ids = Set.new
    smiles_set = Set.new
    ManifestUtil.transform(manifest, inputs) do |type_desc, value|
      case type_desc['type']
      when 'container' then container_ids.add(value)
      when 'aliquot'   then container_ids.add(value['containerId'])
      when 'compound' then smiles_set.add(value['value'])
      #  Ignoring compound format here...
      end
    end

    containers = Container.where(organization_id: organization.id, id: container_ids.to_a)
                          .includes(
                            aliquots:
                              [ :aliquots_compound_links,
                                :compound_links,
                                :minimal_compounds,
                                { contextual_custom_properties: [ :contextual_custom_properties_config ] } ],
                            contextual_custom_properties: [ :contextual_custom_properties_config ]
                          )
    identifiers = smiles_set.map { |smile| { notation: "smiles", value: smile } }
    filter_params = { with_identifiers: identifiers, organization_id: [ nil, organization.id ] }
    available_compounds_smiles = CompoundServiceFacade::GetCompounds
                                 .call(filter_params, CompoundServiceFacade::Scope::ALL)
                                 .distinct
                                 .pluck(:smiles)

    unavailable_containers = container_ids.to_a - containers.map(&:id)
    if !unavailable_containers.empty?
      raise MissingContainersError, unavailable_containers
    end

    unavailable_compounds = smiles_set.to_a - available_compounds_smiles
    if !unavailable_compounds.empty?
      raise MissingCompoundsError, unavailable_compounds
    end

    container_map = containers.map { |c| [ c.id, c ] }.to_h

    # Get container names preferring the container label, type_desc label,
    # then container id.
    container_non_uniq_names = {}
    ManifestUtil.transform(manifest, inputs) do |type_desc, value|
      container = nil
      case type_desc['type']
      when 'container'
        container = container_map[value]
      when 'aliquot'
        container = container_map[value['containerId']]
      end

      if container.present?
        name = container.label || type_desc['label'] || container.id
        escaped_name = name.tr('/', '_')
        container_non_uniq_names[container.id] = escaped_name
      end
    end

    # make names uniq by appending count if need be.
    names_set = Set.new
    uniq_container_names = {}
    container_non_uniq_names.each do |id, name|
      index = 0
      uniq_name = name
      while names_set.include?(uniq_name)
        index += 1
        uniq_name = "#{name}_#{index}"
      end

      names_set.add(uniq_name)
      uniq_container_names[id] = uniq_name
    end

    refs = {}
    transformed_inputs = ManifestUtil.transform(manifest, inputs) do |type_desc, value|
      case type_desc['type']
      when 'container'
        container_id = value
        container    = container_map[container_id]
        name         = uniq_container_names[container_id]

        refs[name] ||= LaunchRequest.container_to_ref_hash(container)
        name
      when 'aliquot'
        container_id = value['containerId']
        well_idx     = value['wellIndex']
        container    = container_map[container_id]
        name         = uniq_container_names[container_id]
        refs[name] ||= LaunchRequest.container_to_ref_hash(container)

        "#{name}/#{well_idx}"

      else
        value
      end
    end

    return {
      refs: refs,
      parameters: transformed_inputs
    }
  end

  def self.get_contextual_properties_mapping(entity)
    return entity.contextual_custom_properties.map { |ctx_prop|
      [ ctx_prop.contextual_custom_properties_config.key, ctx_prop.value ]
    }.to_h
  end

  def self.container_to_ref_hash(container)
    {
      id: container.id,
      label: container.label,
      type: container.container_type_id,
      store: container.storage_condition || 'ambient',
      cover: container.cover,
      aliquots: container.aliquots.map { |aq|
        [ aq.well_idx, {
          name: aq.name,
          volume: aq.volume_ul ? "#{aq.volume_ul}:microliter" : nil,
          mass: aq.mass_mg ? "#{aq.mass_mg}:milligram" : nil,
          compounds: aq.aliquots_compound_links.map do |acl|
            {
              id: acl.compound_link.id,
              smiles: acl.compound_link.compound&.smiles,
              molecularWeight: acl.compound_link.compound&.molecular_weight,
              concentration: acl.concentration,
              solubilityFlag: acl.solubility_flag
            }
          end,
          properties: aq.properties || {},
          contextual_custom_properties: self.get_contextual_properties_mapping(aq) || {}
        } ]
      }.to_h,
      properties: container.properties || {},
      contextual_custom_properties: self.get_contextual_properties_mapping(container) || {}
    }
  end

end

class LaunchRequestError < StandardError
end

class MissingContainersError < LaunchRequestError
  def initialize(container_ids)
    @containers = container_ids
  end

  def message
    "The following containers are unavailable: #{@containers.join(', ')}. Please select alternate containers."
  end
end

class MissingCompoundsError < LaunchRequestError
  def initialize(smiles_set)
    @compounds = smiles_set
  end

  def message
    "The following compounds are unavailable: #{@compounds.join(', ')}. Please Register the compound"
  end
end
