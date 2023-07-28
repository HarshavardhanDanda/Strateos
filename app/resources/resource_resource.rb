require 'base_resource'

module Api
  module V1
    class ResourceResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      # removing unnecessary attributes from subclasses.
      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash.except(:organization_id, :compound)
        subclass._attributes = self._attributes.except(:organization_id, :compound)
        subclass._relationships = {}
      end

      # Add model hints to support polymorphic datatypes
      model_hint model: Cell, resource: :resource
      model_hint model: ChemicalStructure, resource: :resource
      model_hint model: NucleicAcid, resource: :resource
      model_hint model: Protein, resource: :resource
      model_hint model: Reagent, resource: :resource
      model_hint model: Virus, resource: :resource
      model_hint model: Solvent, resource: :resource

      add_attribute :name
      add_attribute :organization_id
      add_attribute :created_at
      add_attribute :updated_at
      add_attribute :deleted_at
      add_attribute :description
      add_attribute :kind
      add_attribute :properties
      add_attribute :design
      add_attribute :acl
      add_attribute :storage_condition
      add_attribute :sensitivities
      add_attribute :purity
      add_attribute :compound

      has_one :compound

      def compound
        c = CompoundServiceFacade::GetCompounds.call({ compound_id: @model.compound&.id },
                                                        CompoundServiceFacade::Scope::PUBLIC).first
        Api::V1::CompoundResource.new(c.as_json(CompoundLink.flat_with_compound_json), nil)
      end

      # TODO: Find a way to limit/paginate included resource.
      # has_one :aliquots

      # has_many :kit_items
      # has_many :kits
      # has_one  :organization
    end
  end

  module V2
    class ResourceResource < Api::V1::ResourceResource

      has_one :organization
      has_one :compound, eager_load_on_include: false

      def compound
        return nil unless @model.compound

        c = CompoundServiceFacade::GetCompounds.call({ compound_id: @model.compound&.id },
                                                        CompoundServiceFacade::Scope::PUBLIC).first
        Api::V2::CompoundResource.new(c, context) if c
      end
    end
  end
end
