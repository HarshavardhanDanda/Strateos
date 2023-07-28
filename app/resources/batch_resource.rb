require 'base_resource'

module Api
  module V1
    class BatchResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :reaction_id
      add_attribute :purity
      add_attribute :post_purification_mass_yield_mg
      add_attribute :product_type
      add_attribute :organization_id
      add_attribute :compound_link_id
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :contextual_custom_properties
      add_attribute :samples_created_at
      add_attribute :name
      add_attribute :created_by
      add_attribute :run_count

      add_attribute :synthesis_program_name
      add_attribute :synthesis_request_name

      has_one :organization
      has_one :user
      has_one :synthesis_request
      has_one :synthesis_program
      has_one(:compound, relation_name: :compound_link)
      has_many :aliquots
      has_many :containers
      has_many :runs

      def contextual_custom_properties
        @model.contextual_custom_properties
      end

      filter :reaction_id
      filter :compound_link_id
      filter :id
      filter :created_by

      filter 'containers.container_type.id', apply: lambda { |records, ids, _options|
        records.joins(:containers).where(containers: { container_type_id: ids })
      }

      filter :name, apply: lambda { |records, value, _options|
        records.where("batches.name ilike '%' || ? || '%'", value[0])
      }

      filter :all, apply: lambda { |records, value, _options|
        records.where("batches.name ilike '%' || ? || '%'", value[0]).or(
          records.where(id: value[0])
        )
      }

      filter :synthesis_request_id, apply: lambda { |records, value, _options|
        records.joins(synthesis_request_batch: :synthesis_request)
               .where(synthesis_requests: { id: value[0] })
      }

      filter :search_similarity, apply: lambda { |records, smiles, options|
        smiles = smiles.first
        permissions = options[:context][:user_context].permissions
        organization_ids = self.consuming_orgs_of_user_allowed_labs(permissions)
        organization_ids.push(options[:context][:user_context].organization.id).uniq!

        threshold = 0.7
        compound_link_ids = []

        similarity_search = Compound.similarity_search(
          smiles,
          organization_ids,
          threshold,
          !options[:context][:hide_public]
        )

        similarity_search.pluck('compound_link_id').each do |compound_link_id|
          compound_link_ids.push(compound_link_id)
        end
        records.where(compound_link_id: compound_link_ids)
      }

      filter :purity, apply: lambda { |records, purity, _options|
        purity_bounds = purity.as_json
        min = purity_bounds.dig(0, "min")&.to_f
        max = purity_bounds.dig(0, "max")&.to_f
        records.where(purity: (min || -Float::INFINITY)..(max || Float::INFINITY))
      }

      filter :synthesis_program_id, apply: lambda { |records, value, _options|
        records.joins(:synthesis_program_item).where(synthesis_program_items: { synthesis_program_id: value[0] })
      }

      filter :mass_yield, apply: lambda { |records, mass_yield, _options|
        mass_yield_bounds = mass_yield.as_json
        min = mass_yield_bounds.dig(0, "min")&.to_f
        max = mass_yield_bounds.dig(0, "max")&.to_f
        records.where(post_purification_mass_yield_mg: (min || -Float::INFINITY)..(max || Float::INFINITY))
      }

      def synthesis_program_name
        @model.synthesis_program&.name
      end

      def synthesis_request_name
        @model.synthesis_request&.name
      end

      def sortable_fields
        [
          :purity,
          :post_purification_mass_yield_mg,
          :created_at,
          :samples_created_at,
          :synthesis_program_name,
          :synthesis_request_name
        ]
      end

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end

      def self.apply_sort(records, order_options, context = {})
        if order_options.empty?
          return records
        end

        field, direction = order_options.first
        sort_order = direction == :desc ? 'DESC' : 'ASC'

        if field == 'synthesis_program_name'
          return records.joins('left join synthesis_program_items spi on spi.item_id = batches.id')
                        .joins('left join synthesis_programs sp on spi.synthesis_program_id = sp.id')
                        .order(Arel.sql("LOWER(sp.name) #{sort_order}"))
        end

        if field == 'synthesis_request_name'
          return records.joins('left join synthesis_requests_batches srb on srb.batch_id = batches.id')
                        .joins('left join synthesis_requests sr on srb.synthesis_request_id = sr.id')
                        .order(Arel.sql("LOWER(sr.name) #{sort_order}"))
        end

        super(records, order_options, context)
      end

      def self.consuming_orgs_of_user_allowed_labs(permissions)
        lab_ids = permissions["lab_ctx_permissions"]&.map { |lab| lab["labId"] }
        Lab.where(id: lab_ids).includes(:organizations).pluck(:organization_id)
      end

    end
  end
end
