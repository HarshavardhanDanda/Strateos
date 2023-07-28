require 'base_resource'

module Api
  module V1
    class SynthesisRequestResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name
      add_attribute :created_at
      add_attribute :started_at
      add_attribute :completed_at

      has_one :organization
      has_one :synthesis_program
      has_one :library
      has_many :batches, :through => :synthesis_requests_batches, :source => :batch, :source_type => "Batch"

      filter :organization_id
      filter :synthesis_program_id

      filter :name, apply: lambda { |records, names, _options|
        records.where("name ilike '%#{ActiveRecord::Base.sanitize_sql_like(names.first)}%'")
      }

      def self.creatable_fields(_context)
        [ :name ]
      end

      def self.updatable_fields(_context)
        [ :name, :started_at, :completed_at, :batches ]
      end
    end
  end
end
