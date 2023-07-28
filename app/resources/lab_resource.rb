require 'base_resource'

module Api
  module V1
    class LabResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :name
      add_attribute :operated_by_id
      add_attribute :operated_by_name
      add_attribute :operating
      add_attribute :consuming
      add_attribute :address

      filter :operated_by_id

      filter :operating, apply: lambda { |records, bool, _options|
        filter_params = { operated_by: _options[:context][:user_context].organization }
        return bool ? records.where(filter_params) : records.where.not(filter_params)
      }

      filter :consuming, apply: lambda { |records, bool, _options|
        filter_params = {
          lab_consumers: LabConsumer.where(
            organization_id: _options[:context][:user_context].organization.id
          )
        }
        return bool ? records.where(filter_params) : records.where.not(filter_params)
      }

      filter :feature, apply: lambda { |records, feature, options|
        permissions = ACCESS_CONTROL_SERVICE.user_acl(options[:context][:user_context].user,
                                                      options[:context][:user_context].organization)
        labs = permissions && permissions["lab_ctx_permissions"]&.select { |lab| lab["features"].include?(feature[0]) }
        lab_ids = labs&.map { |lab| lab["labId"] }

        return records.where(id: lab_ids)
      }

      def self.default_sort
        [ { field: 'name', direction: :asc } ]
      end

      def operated_by_name
        @model.operated_by.name
      end

      def operating
        @context[:user_context].organization.id == @model.operated_by.id
      end

      def consuming
        LabConsumer.where(
          organization_id: @context[:user_context].organization, lab_id: @model.id
        ).length >= 1
      end
    end
  end
end
