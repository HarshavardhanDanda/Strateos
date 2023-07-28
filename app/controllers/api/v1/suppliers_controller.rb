module Api
  module V1
    class SuppliersController < Api::ApiController

      def create
        data = params.require(:data).to_unsafe_hash
        validate_json(Supplier::SUPPLIER_CREATION_SCHEMA, data)
        name = data.dig(:attributes, :name)

        org_id = data.dig(:attributes, :organization_id)
        if org_id
          @org = Organization.find(org_id)
          authorize(@org, :member?)
        end
        @supplier = @org.suppliers.build(name: name)
        authorize(@supplier, :create?)
        if @supplier.save
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::SupplierResource)
          supplier   = Api::V1::SupplierResource.new(@supplier, context)
          json       = serializer.serialize_to_hash(supplier)
          render json: json, status: :created
        else
          render json: @supplier.errors, status: :unprocessable_entity
        end
      end
    end
  end
end
