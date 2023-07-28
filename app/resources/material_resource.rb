require 'base_resource'

module Api
  module V1
    class MaterialResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :updated_at
      add_attribute :name
      add_attribute :url
      add_attribute :note
      add_attribute :is_private
      add_attribute :material_type
      add_attribute :total_ordered

      has_one :vendor
      has_one :supplier
      has_one :organization

      has_many :categories, acts_as_set: true
      has_many :material_components
      has_many :orderable_materials

      def self.sortable_fields(_context = nil)
        super + [ :'vendor.name', :'supplier.name' ]
      end

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end

      filters :vendor_id, :material_type, :supplier_id, :organization_id

      filter :compound_id, apply: lambda { |records, c_id, _options|
        records.by_compound_id(c_id)
      }

      filter :category_id, apply: lambda { |records, c_id, _options|
        records.by_category_id(c_id)
      }

      filter :smiles, apply: lambda { |records, values, _options|
        return records.none if values.empty?

        smiles = values.first
        begin
          compounds = CompoundService.summarize_compounds([ { smiles: smiles } ])
          return records.none if compounds.empty?

          records.by_compound_id(compounds.first.id)
        rescue WalterServiceError => e
          Rails.logger.info("Walter Error: #{e.message}")
          return records.none
        end
      }

      filter :query, apply: lambda { |records, q, _options|
        return records if q.empty?
        query_string = "%#{q[0]}%"
        joined_records = records.joins(:vendor).joins(:material_components => :resource)
        return records.none if joined_records.empty?
          joined_records.where("materials.id ilike ?", query_string).or(
          joined_records.where("materials.name ilike ?", query_string)).or(
          joined_records.where("vendors.name ilike ?", query_string)).or(
          joined_records.where("resources.id ilike ?", query_string)).or(
          joined_records.where("resources.name ilike ?", query_string))
      }

      filter :suppliers, apply: lambda { |records, value, _options|
        records.filter_by_supplier(value)
      }

      filter :provisionable, apply: lambda { |records, value, _options|
        return records if value.empty?
        records.filter_by_provisionable(value[0])
      }

      before_save do
        @model.organization_id = @context[:user_context].organization.id if @model.new_record?
      end

    end
  end
end
