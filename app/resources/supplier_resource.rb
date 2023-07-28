require 'base_resource'

module Api
  module V1
    class SupplierResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :name
      add_attribute :updated_at
      add_attribute :is_preferred
      add_attribute :supplier_has_materials

      has_many :materials

      filter :name, apply: lambda { |records, names, _options|
        return records if names.empty?
        records.where("name ILIKE ?", "%#{names.first}%")
      }

      filter :is_preferred, apply: lambda { |records, is_preferred, _options|
        return records if is_preferred.empty?
        _options[:paginator] = nil
        records.where("is_preferred = ?", is_preferred)
      }

      filter :full_name, apply: lambda { |records, names, _options|
        records.where("name = ?", names.first)
      }

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end
    end
  end
end
