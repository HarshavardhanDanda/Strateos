require 'base_resource'

module Api
  module V1
    class IntakeKitResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :address_id
      add_attribute :carrier
      add_attribute :created_at
      add_attribute :easy_post_label_url
      add_attribute :easy_post_shipment_id
      add_attribute :est_delivery_date
      add_attribute :name
      add_attribute :organization_id
      add_attribute :received_at
      add_attribute :status
      add_attribute :status_message
      add_attribute :status_update_time
      add_attribute :tracking_number
      add_attribute :updated_at
      add_attribute :user_id
      add_attribute :lab_id
      add_attribute :admin_processed_at
      add_attribute :intake_kit_items
      add_attribute :invoice_item_id

      # Methods
      add_attribute :organization
      add_attribute :lab
      add_attribute :items_count

      def sortable_fields
        [
          :created_at,
          :admin_processed_at,
          :organization,
          :items_count,
          :lab
        ]
      end

      def organization
        @model.organization.as_json({
          only: [ :id, :name ],
          include: [],
          methods: []
        })
      end

      def lab
        @model.lab.as_json({
          only: [ :id, :name ],
          include: [],
          methods: []
        })
      end

      def items_count
        intake_kit_items.pluck(:quantity).reduce(:+)
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

        if field == 'organization'
          ordered_records = records
          .joins('left join organizations on intake_kits.organization_id = organizations.id')
          .order(Arel.sql("LOWER(organizations.name) #{sort_order}"))

          return ordered_records
        end

        if field == 'lab'
          ordered_records = records
          .joins('left join labs on intake_kits.lab_id = labs.id')
          .order(Arel.sql("LOWER(labs.name) #{sort_order}"))

          return ordered_records
        end

        if field == 'items_count'
          ordered_records = records
          .joins('left join intake_kit_items on intake_kits.id = intake_kit_items.intake_kit_id')
          .group("intake_kits.id")
          .order(Arel.sql("coalesce(sum(intake_kit_items.quantity),0) #{sort_order}"))

          return ordered_records
        end

        super(records, order_options, context)
      end

      filter :admin_processed_at, apply: lambda { |records, timestamp, options|
        if timestamp.include?('null') || timestamp.empty?
          records.where(admin_processed_at: nil).order(created_at: :desc)
        else
          records.where(admin_processed_at: timestamp).order(created_at: :desc)
        end
      }

      filter :organization_id
      filter :lab_id
      filter :status

      has_one :address
      has_one :organization
      has_one :user
      has_one :lab
    end
  end
end
