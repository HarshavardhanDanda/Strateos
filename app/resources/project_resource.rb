require 'base_resource'

module Api
  module V1
    class ProjectResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :acl
      add_attribute :archived_at
      add_attribute :bsl
      add_attribute :created_at
      add_attribute :event_stream_settings
      add_attribute :name
      add_attribute :organization_id
      add_attribute :payment_method_id
      add_attribute :slug
      add_attribute :updated_at
      add_attribute :visibility
      add_attribute :webhook_url
      add_attribute :run_count
      add_attribute :is_implementation

      has_one :organization

      # has_many :active_runs
      # has_many :collaborators
      # has_many :completed_runs
      # has_many :datasets
      # has_many :invoice_items
      # has_many :notebooks
      # has_many :runs
      # has_many :runs_without_large_columns
      # has_many :users
      # has_one  :payment_method

      def self.updatable_fields(_context)
        super - [ :organization_id ]
      end

      filter :query, apply: lambda { |records, q, _options|
        return records if q.empty?

        query_string = "%#{q[0]}%"
        records.where("name ilike ?", query_string).or(
          records.where("id ilike ?", query_string)
        )
      }

      filter :organization_id
      filter :is_implementation
      filter :archived_at, default: 'none', apply: lambda { |records, value, _options|

        # Note that in order to default filter to null, apply filter must be used to activate the filter,
        # default: nil will simply not have a default
        if value[0] == 'none'
          records.where(archived_at: nil)
        else
          records.where(archived_at: value[0])
        end
      }

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end

      def run_count
        @model.run_count
      end
    end
  end
end
