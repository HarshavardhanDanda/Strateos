require 'base_resource'

module Api
  module V1
    class AliquotResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      # attributes in this class are not available to its subclasses by default.
      # This callback copies this class's _attribute_hash to subclasses.
      def self.inherited(subclass)
        super
        subclass._attribute_hash = self._attribute_hash
      end

      INVENTORY_LIST_PAGE_SIZE = 12
      MAX_CONTAINER_ALIQUOT_COUNT = 1536

      add_attribute :amount
      add_attribute :container_id
      add_attribute :created_at
      add_attribute :created_by_run_id
      add_attribute :deleted_at
      add_attribute :lot_no
      add_attribute :mass_mg
      add_attribute :name
      add_attribute :properties
      add_attribute :resource_id
      add_attribute :resource_id_last_changed_at
      add_attribute :updated_at
      add_attribute :version
      add_attribute :volume_ul
      add_attribute :well_idx
      add_attribute :hazards

      has_many :contextual_custom_properties
      has_one :container
      has_one :resource
      has_many :aliquots_compound_links
      has_many(:compounds, relation_name: :compound_links)
      has_many :batches

      filter :container_id, apply: lambda { |records, c_ids, options|
        # Using the foreign key "container_id" is causing latency issues for lower values of "limit"
        records.where("aliquots.container_id IN (?)",c_ids)
      }

      filter :compound, apply: lambda { |records, compound_link_id, options|
        records.joins(:aliquots_compound_links)
               .where(aliquots_compound_links: { compound_link_id: compound_link_id })
      }

      filter :batch, apply: lambda { |records, batch_id, options|
        records.joins(:batches).where(batches: { id: batch_id })
      }

      filter :well_idx

      def self.updatable_fields(_context)
        [ :name, :volume_ul, :resource_id ]
      end

      JSONAPI.configure do |config|
        config.maximum_page_size = INVENTORY_LIST_PAGE_SIZE * MAX_CONTAINER_ALIQUOT_COUNT
      end
    end
  end

  module V2
    class AliquotResource < Api::V1::AliquotResource

    end
  end
end
