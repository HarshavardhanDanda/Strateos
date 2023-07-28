class CompoundLink < ApplicationRecord
  has_snowflake_id('cmpl')

  audit_trail only: [ :name, :compound, :labels ]

  def generate_audit_trail_header_message(event_type)
    params = {
      class_name: 'Compound', # we don't want the customer to see Compound link in description
      id: id
    }

    I18n.t(
      event_type.parameterize.to_sym,
      scope: :audit_trail,
      **params,
      default: DEFAULT_AUDIT_MESSAGES[event_type]
    )
  end

  belongs_to :organization
  belongs_to :compound
  has_many :labelings, as: :labelable, dependent: :destroy
  has_many :labels, through: :labelings
  has_many :contextual_custom_properties, as: :context, dependent: :destroy
  has_many :batches

  # Aliquot through association
  has_many :aliquots_compound_links, class_name: :AliquotCompoundLink, dependent: :destroy
  has_many :aliquots, through: :aliquots_compound_links

  has_many :compound_link_external_system_ids
  has_and_belongs_to_many :libraries

  accepts_nested_attributes_for :compound_link_external_system_ids

  # Methods that proxy through to the underlying compound
  # required for the JSON API serializer
  delegate :clogp,
           :formula,
           :inchi,
           :inchi_key,
           :molecular_weight,
           :exact_molecular_weight,
           :morgan_fingerprint,
           :sdf,
           :smiles,
           :tpsa,
           :unknown,
           :flammable,
           :oxidizer,
           :strong_acid,
           :water_reactive_nucleophile,
           :water_reactive_electrophile,
           :general,
           :peroxide_former,
           :strong_base,
           :no_flags,
           :pub_chem_id,
           :mfcd_number,
           :cas_number,
           to: :compound, allow_nil: true

  validate :validate_hazardous_locations
  validate :validate_structureless

  validates :compound, allow_nil: true, uniqueness: { scope: :organization_id, smiles: proc { |c| c[:value]&.smiles }}

  scope :by_org_and_public, lambda { |org_id|
    where("compound_links.organization_id = ? "\
          "OR compound_links.organization_id is NULL", org_id)
  }

  scope :by_creator, lambda { |created_by|
    where("compound_links.created_by = ?", created_by)
  }

  scope :private_only, -> { where.not(organization_id: nil) }
  scope :public_only, -> { where(organization_id: nil) }

  scope :by_content, lambda { |query, search_field, organization_ids, curr_org|
    query = "%#{query}%"

    case search_field
    when 'name'
      where("compound_links.name ilike ?", query)
    when 'reference_id'
      where("compound_links.reference_id ilike ?", query)
    when 'id'
      where("compound_links.id ilike ?", query)
    when 'cas_number'
      joins(:compound).where("compounds.cas_number ilike ?", query)
    when 'external_system_id'
      joins(:compound_link_external_system_ids).where("compound_link_external_system_ids.organization_id IN (?)
      AND compound_link_external_system_ids.external_system_id ilike ?", organization_ids, query)
    when 'library'
      joins(:libraries).where("libraries.organization_id = (?)
      AND libraries.name ilike ?", curr_org.id, query)
    when 'all'
      left_joins(:compound)
      .left_joins(:compound_link_external_system_ids)
      .left_joins(:libraries)
      .where("compound_links.name ilike ? "\
             "OR compound_links.reference_id ilike ? "\
             "OR compound_links.id ilike ? "\
             "OR compounds.cas_number ilike ?" \
             "OR (compound_link_external_system_ids.organization_id IN (?) "\
             "AND compound_link_external_system_ids.external_system_id ilike ?)"\
             "OR (libraries.organization_id = (?) "\
             "AND libraries.name ilike ?)",
             query, query, query, query, organization_ids, query,curr_org.id, query)
    end
  }

  scope :by_availability, lambda { |status|
    joins(aliquots: [ :container ]).where("containers.status = ?", status)
  }

  scope :by_property, lambda { |property, min_bound, max_bound|
    if min_bound && max_bound
      joins(:compound).where("compounds.#{property} between ? and ?", min_bound, max_bound)
    elsif min_bound
      joins(:compound).where("compounds.#{property} >= ?", min_bound)
    elsif max_bound
      joins(:compound).where("compounds.#{property} <= ?", max_bound)
    end
  }

  scope :by_labels, lambda { |label_names|
    joins(labelings: :label).where(labels: { name: label_names })
  }

  scope :by_identifier, lambda { |query, notation = nil|
    notation&.downcase!
    if [ 'inchi', 'smiles' ].include?(notation)
      joins(:compound).where("compounds.#{notation} = ?", query)
    else
      joins(:compound).where("compounds.inchi = ? OR compounds.smiles = ?", query, query)
    end
  }

  scope :by_flags, lambda { |flags|
    flag_queries = []
    flags.each do |flag|
      flag_queries.append("compounds.#{flag}=true")
    end

    joins(:compound).where(flag_queries.join(" OR "))
  }

  attr_accessor :search_score

  searchkick(
    batch_size: 200,
    word_start: [ :id, :formula, :smiles ],
    callbacks: :async,
    case_sensitive: true
  )

  # can't use delegate since we change the method name here
  def flags
    compound&.existing_flags
  end

  def self.flat_json
    { only: self.column_names,
      include: {
        contextual_custom_properties: ContextualCustomProperty::FULL_JSON
      }, methods: [] }
  end

  def self.flat_with_compound_json
    { only: self.column_names,
      include: {
        contextual_custom_properties: ContextualCustomProperty::FULL_JSON
      }, methods: [
        :inchi,
        :inchi_key,
        :molecular_weight,
        :exact_molecular_weight,
        :morgan_fingerprint,
        :sdf,
        :smiles,
        :tpsa,
        :unknown,
        :flammable,
        :oxidizer,
        :strong_acid,
        :water_reactive_nucleophile,
        :water_reactive_electrophile,
        :general,
        :peroxide_former,
        :strong_base,
        :no_flags,
        :pub_chem_id,
        :mfcd_number,
        :cas_number
      ] }
  end

  def delete_labels(labels)
    labels.each do |l|
      label = scoped_labels.with_name(l[:name]).first
      if label
        labelings.where(label: label).destroy_all
        label.destroy unless label.labelings.any?
      end
    end
  end

  def add_labels(labels)
    labels.each do |l|
      label = scoped_labels.lock.with_name(l[:name]).first_or_create!
      labelings.lock.find_or_create_by(label: label)
    end
  end

  def scoped_labels
    return organization.labels if organization

    Label.public_only
  end

  def search_data
    searchkick_as_json(CompoundLink.flat_json)
      .merge(
        {
          formula: formula,
          smiles: smiles
        }
      )
  end

  def update_flags(flags)
    flags.each do |flag, set_value|
      compound[flag] = set_value
    end

    return unless valid?

    compound.save!
  end

  def set_core_fields_if_not_set(core_attributes, user_context)
    has_modified_data = false
    core_attributes.each do |key, value|
      if compound[key].present?
        Rails.logger.warn("ignored update since value for #{key} already exist for compound_id: #{compound.id}")
      else
        has_modified_data = true
        compound[key] = value
      end
    end

    if has_modified_data && !CompoundLinkPolicy.new(user_context, self).update?
      raise Pundit::NotAuthorizedError, "Not allowed to modify compound"
    end

    compound.save!
  end

  def is_public?
    self.organization_id.nil?
  end

  def self.create_compounds(compounds, creator_id)
    response = {
      created: [],
      errored: []
    }
    organization_id = compounds.first.dig(:attributes, :organization_id)

    compounds.each do |compound|
      attributes = compound[:attributes]
      contextual_custom_property_params = attributes[:contextual_custom_properties] || []
      compound_identifier, * = attributes[:compound].keys
      is_structureless = compound_identifier.nil?

      # If it's a structureless compound, there is no created compound
      # If single compound, no need to search created_compounds
      # This way we can accept a non-canonicalized compound as input.
      created_compound = if is_structureless
                           nil
                         else
                           compound = CompoundService.create_compounds([ compound ]).first
                           if compound.errors.present?
                             response[:errored].append(compound)
                             next
                           end
                           compound
                         end

      external_system_id = if attributes[:external_system_id].nil?
                             []
                           else
                             [
                               {
                                 external_system_id: attributes[:external_system_id],
                                 organization_id: organization_id
                               }
                             ]
                           end

      found_link = find_compound_link(created_compound, external_system_id, organization_id)
      if found_link.present?
        update_labels_and_ccps(attributes, contextual_custom_property_params, found_link, organization_id, response)
      else
        new_link = CompoundLink.new(
          name: attributes[:name],
          reference_id: attributes[:reference_id],
          created_by: creator_id,
          organization_id: organization_id,
          properties: attributes[:properties] || {},
          compound: created_compound,
          compound_link_external_system_ids_attributes: external_system_id
        )
        begin
          new_link.save!
          update_labels_and_ccps(attributes, contextual_custom_property_params, new_link, organization_id, response)
        rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => e
          found_link = find_compound_link(created_compound, external_system_id, organization_id)
          if found_link.present?
            update_labels_and_ccps(attributes, contextual_custom_property_params, found_link, organization_id, response)
          elsif created_compound.present? &&
                CompoundLink.exists?(compound: created_compound, organization_id: organization_id)
            new_link.errors.clear
            new_link.errors.add(
              :compound_link_external_system_ids, :not_match,
              value: external_system_id.first.nil? ? nil : external_system_id.first[:external_system_id],
              smiles: new_link.compound.nil? ? nil : new_link.compound.smiles
            )
            Rails.logger.error(ActiveRecord::RecordInvalid.new(new_link).message)
            response[:errored].append(new_link)
          else
            Rails.logger.error(e.message)
            response[:errored].append(new_link)
          end
        end
      end
    end
    return response
  end

  def self.build_compound_links(request, creator_id)
    response = []
    compound_identifiers = request.map { |r| r.dig(:attributes, :compound) }
    summarized_compounds = CompoundService.summarize_compounds(compound_identifiers)

    request.each_with_index do |compound, cmpd_index|
      attributes = compound[:attributes]
      compound_link = CompoundLink.new(
        name: attributes[:name],
        reference_id: attributes[:reference_id],
        created_by: creator_id,
        organization_id: attributes[:organization_id],
        properties: attributes[:properties] || {}
      )
      compound_summary = summarized_compounds[cmpd_index]
      compound_link.compound = compound_summary
      compound_link.id = "summary_#{compound_summary.smiles}"
      response.append(compound_link)
    end
    return response
  end

  def validate_hazardous_locations
    if compound
      hazards = compound.existing_flags
      container_ids = aliquots.pluck(:container_id).uniq
      if !container_ids.empty?
        location_container_ids = Container
                                 .where("id = ANY(ARRAY[?])", container_ids).pluck(:location_id, :id)
                                 .select { |row| !row[0].nil? }
        location_ids = location_container_ids.map { |row| row[0] }
        locations = Location
                    .where("id = ANY(ARRAY[?])", location_ids)
                    .select { |location| (location.all_blacklisted_hazards & hazards).any? }
        if !locations.empty?
          incompatible_location_containers = location_container_ids.select { |row| location_ids.include? row[0] }
          errors.add(:compound,
                     "hazard is blacklisted in locations with containers: #{incompatible_location_containers}")
        end
      end
    end
  end

  def validate_structureless
    external_system_id = self.compound_link_external_system_ids.first
    if self.compound.nil? && external_system_id.nil?
      errors.add(:compound, "without structure must have an external system ID")
    end
  end

  class InvalidOperation < StandardError
    def initialize(err_str)
      @err_str = err_str
    end

    def message
      @err_str
    end
  end

  def self.check_external_system_id_new_or_equal_to_existing(provided_external_system_id, found_link, organization_id)
    # get the external system id using the compound link found
    existing_compound_link_external_system_id = CompoundLinkExternalSystemId.find_by(
      compound_link: found_link,
      organization_id: organization_id
    )&.external_system_id

    # if the provided external system id is not null and it doesn't have a match, including if a external system id
    # for the found link does not exist, raise an error
    if (!provided_external_system_id.nil? and
      existing_compound_link_external_system_id != provided_external_system_id) or
       # if the provided external system id is null and there is an external system id for the
       # found link, raise an error
       (provided_external_system_id.nil? and
         !existing_compound_link_external_system_id.nil?)
      raise CompoundLink::InvalidOperation, "Compound already has a different external system id associated with it."
    end
  end

  def update_compound(data, user_context)
    response = { compound: nil, error: nil }

    ActiveRecord::Base.transaction do
      # process actions first
      actions = data[:actions] || {}

      is_modifying_compound_link =
        (actions.key?(:add_properties) && actions[:add_properties].any?) ||
        (actions.key?(:delete_properties) && actions[:delete_properties].any?)

      if is_modifying_compound_link && !CompoundLinkPolicy.new(user_context, self).update?
        raise Pundit::NotAuthorizedError, "Not allowed to modify compound"
      end

      self.properties.merge!(actions[:add_properties] || {})
      self.properties.except!(*(actions[:delete_properties] || []))

      # process attributes
      self.assign_attributes(data[:attributes].except(:labels, :compound, :external_system_id,
                                                      :reference_id, :name, :contextual_custom_properties) || {})

      # separate compound attributes to hazards, core_attributes (pub_chem_id, cas_number, mfcd_number
      # and update them to compound
      if self.compound.present? && (data[:attributes].include?(:compound) && data[:attributes][:compound].present?)
        core_attributes_list = [ :cas_number, :pub_chem_id, :mfcd_number ]
        cp_attributes_to_update = data[:attributes][:compound]
        hazard_attributes = cp_attributes_to_update.except(*core_attributes_list) || {}
        non_hazard_attributes = cp_attributes_to_update.except(*hazard_attributes.keys)

        self.set_core_fields_if_not_set(non_hazard_attributes, user_context)

        if hazard_attributes.present?
          unless CompoundLinkPolicy.new(user_context, self).can_edit_hazard?
            raise Pundit::NotAuthorizedError, "Not allowed to edit hazards"
          end

          self.update_flags(hazard_attributes)
        end
      end

      #  process external system id
      if data[:attributes].include?(:external_system_id)

        unless CompoundLinkPolicy.new(user_context, self).update_external_system_id?
          raise Pundit::NotAuthorizedError, "Not allowed to modify compound"
        end

        external_system_id = data[:attributes][:external_system_id]
        if self.compound_link_external_system_ids.empty? || (!self.compound_link_external_system_ids.empty? &&
          self.compound_link_external_system_ids.first.external_system_id != external_system_id)

          CompoundLinkExternalSystemId.upsert(external_system_id, self.id, user_context.organization.id)
        end
      end

      if data[:attributes].include?(:reference_id)
        reference_id = data[:attributes][:reference_id]
        self.reference_id = reference_id.empty? ? nil : reference_id
      end

      if data[:attributes].include?(:name)
        name = data[:attributes][:name]
        self.name = name.empty? ? nil : name
      end

      if self.save
        # process contextual custom properties
        contextual_custom_properties_attrs = data[:attributes].fetch(:contextual_custom_properties, [])
        contextual_custom_properties_attrs.each do |ccp_attr|
          ContextualCustomProperty.upsert_with_key(ccp_attr[:key], ccp_attr[:value], self,
                                                   self.organization)
        end

        # process label actions
        self.add_labels(actions[:add_labels] || {})
        self.delete_labels(actions[:delete_labels] || {})

        response[:compound] = self
      else
        resource = Api::V1::CompoundResource.new(self, user_context)
        e = JSONAPI::Exceptions::ValidationErrors.new(resource)
        response[:error] = e
      end
    end
    response
  end

  private

  def self.update_labels_and_ccps(attributes, ccps, compound_link, organization_id, response)
    begin
      compound_link.add_labels(attributes[:labels] || {})
      ccps.each do |ccp_param|
        ContextualCustomProperty.upsert_with_key(ccp_param[:key], ccp_param[:value], compound_link, organization_id)
      end
      response[:created].append(compound_link)
    rescue StandardError => e
      Rails.logger.error(e.message)
      compound_link.errors.add(:base, e.message)
      response[:errored].append(compound_link)
    end
  end

  def self.find_compound_link(created_compound, external_system_id, organization_id)
    CompoundLink
      .left_outer_joins(:compound_link_external_system_ids)
      .find_by(organization_id: organization_id,
               compound: created_compound,
               compound_link_external_system_ids: (
                 if external_system_id.empty?
                   { id: nil }
                 else
                   external_system_id.first
                 end))
  end
end
