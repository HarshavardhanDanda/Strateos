require 'base_resource'

module Api
  module V1
    class MixtureComponentResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :starting_concentration
      add_attribute :target_concentration
      add_attribute :is_diluent

      has_one :mixture
      has_one :vendor
      has_one :supplier
      has_one :mixable, polymorphic: true

      # to serialize mixable polymorphic resources
      model_hint model: Cell, resource: :resource
      model_hint model: ChemicalStructure, resource: :resource
      model_hint model: NucleicAcid, resource: :resource
      model_hint model: Protein, resource: :resource
      model_hint model: Reagent, resource: :resource
      model_hint model: Virus, resource: :resource
      model_hint model: Solvent, resource: :resource
    end
  end
end
