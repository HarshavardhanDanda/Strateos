require 'base_resource'

module Api
  module V1
    class ContainerTypeResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :acceptable_lids
      add_attribute :capabilities
      add_attribute :catalog_number
      add_attribute :col_count
      add_attribute :cost_each
      add_attribute :dead_volume_ul
      add_attribute :height_mm
      add_attribute :is_tube
      add_attribute :manual_execution
      add_attribute :name
      add_attribute :retired_at
      add_attribute :safe_min_volume_ul
      add_attribute :sale_price
      add_attribute :shortname
      add_attribute :well_count
      add_attribute :well_depth_mm
      add_attribute :well_volume_ul
      add_attribute :vendor

      paginator :none

      def sale_price
        @model.sale_price
      end

      filter :well_count
      filter :is_tube

      filter :include_retired, apply: lambda { |records, values, _options|
        return values.present? && values[0].to_s.downcase == "false" ? records.where(retired_at: nil) : records.all
      }

      filter :capabilities, apply: lambda { |records, capabilities, _options|
        query = ContainerType.sanitize_sql_for_assignment([ "capabilities @> array[?]::varchar[]", capabilities ])
        records.where(query)
      }
    end
  end
end
