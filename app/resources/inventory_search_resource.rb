require 'base_resource'

module Api
  module V1
    class InventorySearchResource < Api::BaseResource
      abstract

      add_attribute :aliquot_count
      add_attribute :well_indices
      add_attribute :generated
      add_attribute :hide_tubes
      add_attribute :hide_plates
      add_attribute :page
      add_attribute :per_page
      add_attribute :query
      add_attribute :subdomain
      add_attribute :sort_by
      add_attribute :sort_desc
      add_attribute :storage_condition
      add_attribute :status
      add_attribute :shipped
      add_attribute :materials
      add_attribute :hide_containers_with_pending_runs
      add_attribute :test_mode
      add_attribute :volume
      add_attribute :include
      add_attribute :ignore_score
      add_attribute :search_fields
      add_attribute :compound
      add_attribute :empty_mass
      add_attribute :container_type
      add_attribute :search_hazard
      add_attribute :created_by
      add_attribute :search_score
      add_attribute :compound_link_id
      add_attribute :lab_id
      add_attribute :container_type_id
      add_attribute :compound_count
      add_attribute :mass
      add_attribute :organization_id
      add_attribute :barcode
      add_attribute :contextual_custom_properties
      add_attribute :aliquot_contextual_custom_properties
      add_attribute :container_properties
      add_attribute :batch_ids
      add_attribute :aliquot_properties
      add_attribute :created_after
      add_attribute :created_before
      add_attribute :wildcard_aliquot_ccp
      add_attribute :locations
      add_attribute :locations_deep
      add_attribute :bulk_search
      add_attribute :show_containers_without_runs
      add_attribute :label
      add_attribute :ids
    end
  end
end
