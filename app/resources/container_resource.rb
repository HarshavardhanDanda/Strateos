require 'base_resource'

module Api
  module V1
    class ContainerResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :run_count
      add_attribute :aliquot_count
      add_attribute :barcode
      add_attribute :container_type_id
      add_attribute :container_type_shortname
      add_attribute :cover
      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :device_id
      add_attribute :expires_at
      add_attribute :generated_by_run_id
      add_attribute :is_tube
      add_attribute :orderable_material_component_id
      add_attribute :kit_order_id
      add_attribute :kit_request_id
      add_attribute :label
      add_attribute :location_id
      add_attribute :organization_id
      add_attribute :shipment_code
      add_attribute :shipment_id
      add_attribute :slot
      add_attribute :status
      add_attribute :storage_condition
      add_attribute :test_mode
      add_attribute :updated_at
      add_attribute :empty_mass_mg
      add_attribute :current_mass_mg
      add_attribute :created_by
      add_attribute :lab
      add_attribute :properties
      has_many :contextual_custom_properties

      # Methods
      add_attribute :public_location_description
      add_attribute :suggested_user_barcode
      add_attribute :tared_weight_mg
      add_attribute :hazards
      add_attribute :organization_name
      add_attribute :container_type_name
      add_attribute :suggested_barcode

      has_many :aliquots
      has_many(:compounds, relation_name: :aliquots_compound_links)
      has_one  :container_type
      has_one  :stale_container
      has_one  :shipment
      has_one  :organization
      has_one  :device
      has_one  :location

      # has_many :aliquot_effects
      # has_many :refs
      # has_many :runs
      # has_one  :generated_by_run
      # has_one  :kit_item
      # has_one  :kit_order
      # has_one  :kit_request
      # has_one  :return_sample
      # has_one  :return_shipment

      def public_location_description
        @model.public_location_description
      end

      def container_type_name
        @model.container_type.name
      end

      def container_type_shortname
        @model.container_type.shortname
      end

      filter :organization_id
      filter :barcode
      filter :status
      filter :test_mode

      filter :location_category, apply: lambda { |records, category, _options|
        # do join in SQL to bypass paranoid.
        records.joins(location: :location_type)
               .where(location_types: { category: category })
      }

      filter :run_id, apply: lambda { |records, run_id, _options|
        records.where(runs: { id: run_id }).or(records.where(generated_by_run_id: run_id)).joins(refs: :run)
      }

      filter :created_after, apply: lambda { |records, timestamp_values, _options|
        timestamp = timestamp_values.first.to_i

        records.where('created_at > ?', Time.at(timestamp))
      }

      filter :compound_id, apply: lambda { |records, ids, _options|
        id = ids.first

        # this seems to be faster than a Container -> Aliquot -> AliquotCompoundLink join
        # assuming that the list of matching containers is small
        container_ids = Aliquot.joins(:aliquots_compound_links)
                               .where(aliquots_compound_links: { compound_link_id: id })
                               .pluck(:container_id)

        records.where(id: container_ids)
      }

      filter :id

      def self.updatable_fields(_context)
        [ :label, :cover, :storage_condition, :status, :expires_at, :barcode, :suggested_barcode, :container_type_id,
:location_id ]
      end

      def aliquot_count
        @model.aliquot_count
      end
    end
  end
end
