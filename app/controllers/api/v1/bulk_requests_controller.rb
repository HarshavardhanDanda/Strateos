module Api
  module V1
    class BulkRequestsController < Api::ApiController

      CREATE_SCHEMA = JSON.parse(File.read(Rails.root.join('app/models/schemas/bulk_request_create.json')))

      def create
        validate_json(CREATE_SCHEMA, params.to_unsafe_hash)
        include_param = (params[:include] || '').split(/,\s*/)

        ActiveRecord::Base.transaction do
          bulk_request = BulkRequest.create!(**create_params, created_by: pundit_user.user,
                                         organization: @organization)
          authorize(bulk_request, :create?)
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::BulkRequestResource, include: include_param)
          bulk_request_resource = Api::V1::BulkRequestResource.new(bulk_request, context)
          json = serializer.serialize_to_hash(bulk_request_resource)

          BulkRequestProcessQueueJob.perform_later(bulk_request.id)
          render json: json, status: :created
        end
      end

      def show
        bulk_request = BulkRequest.find(params[:id])
        include_param = (params[:include] || '').split(/,\s*/)
        polling_param = params[:polling]
        authorize(bulk_request, :show?)

        fields = if bulk_request.completed_at.nil? && polling_param
                   { :bulk_requests => [ :id, :completed_at ] }
                 else
                   {}
                 end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::BulkRequestResource, include: include_param,
                                                     fields: fields)
        bulk_request_resource = Api::V1::BulkRequestResource.new(bulk_request, context)
        json = serializer.serialize_to_hash(bulk_request_resource)
        render json: json, status: :ok
      end

      private

      def create_params
        params.require(:data)
              .permit(:context_type, :bulk_action, :expected_records,
                      :search_query => {}, :additional_data => {})
      end
    end
  end
end
