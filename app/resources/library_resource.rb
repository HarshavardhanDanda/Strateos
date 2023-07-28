require 'base_resource'

module Api
  module V1
    class LibraryResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name

      has_one :organization
      has_many :compounds, relation_name: :compound_links

      filter :compound_id, apply: lambda { |records, compound_link_ids, _options|
        records.joins(:compound_links).where(compound_links: { id: compound_link_ids })
      }

      filter :name, apply: lambda { |records, names, _options|
        records.where("name ilike '%#{ActiveRecord::Base.sanitize_sql_like(names.first)}%'")
      }
    end
  end
end
