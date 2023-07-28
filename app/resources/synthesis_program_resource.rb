require 'base_resource'

module Api
  module V1
    class SynthesisProgramResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name

      has_one :organization
      has_many :synthesis_program_items
      has_many :synthesis_requests
      has_many :libraries, :through => :synthesis_program_items, :source => :item, :source_type => "Library"
      has_many :batches, :through => :synthesis_program_items, :source => :item, :source_type => "Batch"
      has_many :return_shipments, :through => :synthesis_program_items, :source => :item,
               :source_type => "ReturnShipment"

      filter :organization_id

      filter :name, apply: lambda { |records, names, _options|
        records.where("name ilike '%#{ActiveRecord::Base.sanitize_sql_like(names.first)}%'")
      }

      def self.creatable_fields(_context)
        [ :name ]
      end

      def self.updatable_fields(_context)
        [ :name, :libraries, :batches, :return_shipments ]
      end
    end
  end
end
