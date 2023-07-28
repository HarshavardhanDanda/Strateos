require 'base_resource'

module Api
  module V1
    class CompoundResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash.dup
      end

      model_name 'CompoundLink'

      # taken from CompoundLink
      add_attribute :name
      add_attribute :reference_id
      add_attribute :organization_id
      add_attribute :created_by
      add_attribute :created_at
      add_attribute :properties

      # taken from walter when available set on similarity search
      add_attribute :search_score

      # taken from Compound
      add_attribute :clogp
      add_attribute :formula
      add_attribute :inchi
      add_attribute :inchi_key
      add_attribute :molecular_weight
      add_attribute :exact_molecular_weight
      add_attribute :morgan_fingerprint
      add_attribute :sdf
      add_attribute :smiles
      add_attribute :tpsa
      add_attribute :compound_id
      add_attribute :pub_chem_id
      add_attribute :cas_number
      add_attribute :mfcd_number

      # hazardous flags
      add_attribute :unknown
      add_attribute :flammable
      add_attribute :oxidizer
      add_attribute :strong_acid
      add_attribute :water_reactive_nucleophile
      add_attribute :water_reactive_electrophile
      add_attribute :general
      add_attribute :peroxide_former
      add_attribute :strong_base
      add_attribute :no_flags

      # taken from Labels
      add_attribute :labels

      add_attribute :organization_name

      add_attribute :contextual_custom_properties

      add_attribute :external_system_ids

      has_many :libraries
      has_many :batches

      def external_system_ids
        permissions = @context[:user_context].permissions
        org_ids = CompoundResource.consuming_orgs_of_user_allowed_labs(permissions)
        org_ids << @context[:user_context].organization.id
        @model.compound_link_external_system_ids.where(organization_id: org_ids)
      end

      def search_score
        @context.dig(:search_score, @model.compound_id)
      end

      def labels
        @model.labels.map { |l| { name: l.name, organization_id: l.organization_id } }
      end

      def organization_name
        if !@model.organization
          return nil
        end

        @model.organization.name
      end

      def sortable_fields
        [
          :created_at,
          :clogp,
          :formula,
          :molecular_weight,
          :exact_molecular_weight,
          :name,
          :reference_id,
          :tpsa,
          :search_score,
          :organization_name,
          :cas_number
        ]
      end

      def self.filters_order
        [
          :id,
          :organization,
          :cas_number,
          :organization_id,
          :container_status,
          :creator,
          :smiles,
          :inchi,
          :inchi_key,
          :source,
          :search_similarity,
          :content,
          :labels,
          :molecular_weight,
          :tpsa,
          :clogp,
          :flags,
          :external_system_id,
          :contextual_custom_properties,
          :container_id,
          :batch_ccp,
          :has_resources
        ]
      end

      filter :id, apply: lambda { |records, value, options|
        options[:paginator] = nil
        records.where('id IN (?)', value)
      }

      # always use this filter
      filter :organization_id, apply: lambda { |records, organization_ids, options|
        organization_id = organization_ids.first
        options[:context][:organization_id] = organization_id
        records.by_org_and_public(organization_id)
      }

      filter :organization, apply: lambda { |records, organization_ids, _options|
        records.where(organization_id: organization_ids)
      }

      filter :inchi_key, apply: lambda { |records, inchi_keys, _options|
        records.joins(:compound).where(compounds: { inchi_key: inchi_keys })
      }

      filter :smiles, apply: lambda { |records, smiles, _options|
        records.joins(:compound).where(compounds: { smiles: smiles })
      }

      filter :contextual_custom_properties, apply: lambda { |records, props, _options|
        cids = []
        props = props[0].to_enum.to_h
        props.each do |key, value|
          cid = ContextualCustomProperty.joins("JOIN contextual_custom_properties_configs
          ON contextual_custom_properties_configs.key = '#{key}' AND
          contextual_custom_properties.contextual_custom_properties_config_id=contextual_custom_properties_configs.id
          AND contextual_custom_properties.value = '#{value}'").pluck :context_id
          if cids.empty?
            cids += cid
          else
            cids &= cid
          end
        end
        records.where('compound_links.id IN (?)', cids)
      }

      filter :batch_ccp, apply: lambda { |records, props, _options|
        ccp_key, ccp_value = props[0].to_enum.to_h.first
        batches = Batch.where_ccp(ccp_key, ccp_value)
        records.joins(:batches).where({ batches: batches })
      }

      filter :container_id, apply: lambda { |records, container_id, _options|
        aqs = Aliquot.where(container_id: container_id)
        cmp_ids = []
        aqs.each do |aq|
          cmp_ids.concat (aq.compound_links.ids)
        end
        records.where(id: cmp_ids)
      }

      filter :has_resources, apply: lambda { |records, has_resources, _options|
        if has_resources
          records.joins(compound: :resources)
        end
      }

      # boolean to hide public compounds, defaults to showing
      filter :source, apply: lambda { |records, values, options|
        source = values.first
        options[:context][:hide_public] = false

        case source
        when 'private'
          options[:context][:hide_public] = true
          records.private_only
        when 'public'
          records.public_only
        else
          records
        end
      }

      filter :container_status, apply: lambda { |records, status, _options|
        records.by_availability(status)
      }

      filter :creator, apply: lambda { |records, user_id, _options|
        records.by_creator(user_id)
      }

      filter :content, apply: lambda { |records, contents, options|
        content = contents.as_json
        permissions = options[:context][:user_context].permissions
        organization_ids = self.consuming_orgs_of_user_allowed_labs(permissions) <<
                           options[:context][:user_context].organization.id

        query = content.dig(0, "query")
        search_field = content.dig(0, "search_field")

        records.by_content(query, search_field, organization_ids, options[:context][:user_context].organization)
      }

      filter :search_similarity, apply: lambda { |records, smiles, options|
        smiles = smiles.first
        permissions = options[:context][:user_context].permissions
        organization_ids = self.consuming_orgs_of_user_allowed_labs(permissions)
        organization_ids.push(options[:context][:user_context].organization.id).uniq!

        options[:context][:similarity_search] = true
        # TODO: don't paginate similarity search because of sorting with
        # search_score which is not a field SQL can sort on.
        options[:paginator] = nil
        threshold = 0.7

        # initialize a search score dict
        search_scores = {}
        compound_ids = []

        similarity_search = Compound.similarity_search(
          smiles,
          organization_ids,
          threshold,
          !options[:context][:hide_public]
        )

        similarity_search.pluck('compound_id', 'search_score').each do |compound_id, score|
          search_scores[compound_id] = score
          compound_ids.push(compound_id)
        end
        options[:context][:search_score] = search_scores

        records.where({ compound_id: compound_ids })
      }

      filter :labels, apply: lambda { |records, labels, _options|
        records.by_labels(labels)
      }

      filter :molecular_weight, apply: lambda { |records, molecular_weight, _options|
        weight_bounds = molecular_weight.as_json
        records.by_property("molecular_weight", weight_bounds.dig(0, "min"), weight_bounds.dig(0, "max"))
      }

      filter :tpsa, apply: lambda { |records, tpsa, _options|
        tpsa_bounds = tpsa.as_json
        records.by_property("tpsa", tpsa_bounds.dig(0, "min"), tpsa_bounds.dig(0, "max"))
      }

      filter :clogp, apply: lambda { |records, clogp, _options|
        clogp_bounds = clogp.as_json
        records.by_property("clogp", clogp_bounds.dig(0, "min"), clogp_bounds.dig(0, "max"))
      }

      filter :flags, apply: lambda { |records, flags, _options|
        records.by_flags(flags)
      }

      filter :external_system_id, apply: lambda { |records, external_system_ids, options|
        # when filtering by external_system_id it's required that we use the correct organization to filter, otherwise
        # we may return PUBLIC compounds that match the external_system_id provided but the external_system_id belongs
        # to a different organization.
        # in order to do that, we attempt to use the organization provided in the organization_id filter. If provided we
        # enforce the user's permissions to view compounds associated with the organization provided. If not provided we
        # use the organization provided in the request's header

        permissions = options[:context][:user_context].permissions
        org_ids = CompoundResource.consuming_orgs_of_user_allowed_labs(permissions)
        org_ids << options[:context][:user_context].organization.id
        org_id = if options[:context][:organization_id]
                   org_ids.include?(options[:context][:organization_id]) ? options[:context][:organization_id] : nil
                 else
                   options[:context][:user_context].organization.id
                 end
        records.joins(:compound_link_external_system_ids)
               .where(compound_link_external_system_ids: {
                 external_system_id: external_system_ids,
                 organization_id: org_id
               })
      }

      # Overwrite sorting logic to allow sorting by fields on compound links and compounds
      #
      # This is a temporary solution as something additional will be needed for search result sorting.
      def self.apply_sort(records, order_options, context = {})
        if order_options.empty?
          return records
        end

        if context[:similarity_search]
          return self.apply_sort_for_similarity_search(records, order_options, context)
        end

        compound_attrs = [ "clogp", "formula", "molecular_weight", "tpsa", "exact_molecular_weight", "cas_number" ]

        # only allow sorting by one field
        field, direction = order_options.first

        sort_order = direction == :desc ? 'DESC' : 'ASC'

        if field == 'organization_name'
          ordered_records = records
                            .joins('left join organizations on compound_links.organization_id = organizations.id')
                            .order(Arel.sql("LOWER(organizations.name) #{sort_order}"))
          return ordered_records
        end

        # if trying to sort by search score without similiraty search activated
        # set field to `created_at`.
        if field == "search_score"
          order_options = { "created_at" => direction }
        elsif compound_attrs.include?(field)
          order_options = { "compound.#{field}" => direction }
        end

        super(records, order_options, context)
      end

      def self.apply_sort_for_similarity_search(records, order_options, context)
        field, direction = order_options.first

        records =
          if context[:search_score].nil?
            records.to_a.sort_by do |compound_link|
              compound_link.try(field.to_sym)
            end
          else
            records.to_a.sort_by do |compound_link|
              context[:search_score][compound_link.compound_id]
            end
          end

        records.reverse! if direction == :desc
        return records
      end

      def self.apply_filters(records, filters, options = {})

        if filters&.any?
          filters_order.each do |filter|
            next unless filters.key?(filter)

            records = apply_filter(records, filter, filters[filter], options)
          end
        end

        records
      end

      def self.consuming_orgs_of_user_allowed_labs(permissions)
        lab_ids = permissions["lab_ctx_permissions"]&.map { |lab| lab["labId"] }
        org_ids = []
        lab_ids&.each do |lab_id|
          org_ids.concat(Lab.find(lab_id).organizations.map(&:id))
        end
        org_ids
      end
    end
  end

  module V2
    class CompoundResource < Api::V1::CompoundResource
    end
  end
end
