module Api
  module V1
    class VendorsController < Api::ApiController
      def create
        @vendor = Vendor.new(params.require(:data).require(:attributes).permit(:name))
        @vendor.organization = @organization
        authorize(@vendor, :create?)

        if @vendor.save
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::VendorResource)
          vendor     = Api::V1::VendorResource.new(@vendor, context)
          json       = serializer.serialize_to_hash(vendor)

          render json: json, status: :created
        else
          render json: @vendor.errors, status: :unprocessable_entity
        end
      end
    end
  end
end
