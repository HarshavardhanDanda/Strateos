require 'base_resource'

module Api
  module V1
    class MixtureResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :label
      add_attribute :description
      add_attribute :created_by_id

      has_one :organization
      has_many :mixture_components

      def sortable_fields
        [ :label, :created_at ]
      end

      def self.default_sort
        [ { field: :label, direction: :asc } ]
      end

      filters :id, :label, :description

      filter :query, apply: lambda { |records, q, _options|
        return records if q.empty?

        query_string = "%#{q[0]}%"
        joined_records = records.joins(:resources).distinct
        return records.none if joined_records.empty?
            joined_records.where("mixtures.id = ?", q[0])
               .or(joined_records.where("mixtures.label ilike ?", query_string))
               .or(joined_records.where("mixtures.description ilike ?", query_string))
               .or(joined_records.where("mixture_components.id = ?", q[0]))
               .or(joined_records.where("resources.id = ?", q[0]))
               .or(joined_records.where("resources.name ilike ?", query_string))
      }
    end
  end
end
