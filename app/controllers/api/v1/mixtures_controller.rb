module Api
  module V1
    class MixturesController < Api::ApiController

      CREATE_MIXTURE_SCHEMA = JSON.parse(File.read(Rails.root.join('app/models/schemas/mixture_create.json')))

      def create
        validate_json(CREATE_MIXTURE_SCHEMA, params.to_unsafe_hash)
        include_param = (params[:include] || '').split(/,\s*/)

        mixture = Mixture.new(**create_params, organization: @organization)
        mixture.created_by = pundit_user.user
        authorize(mixture, :create?)
        mixture.save!
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::MixtureResource, include: include_param)
        mixture_resource = Api::V1::MixtureResource.new(mixture, context)
        json = serializer.serialize_to_hash(mixture_resource)
        render json: json, status: :created
      end

      private

      def create_params
        mixture_component_params = [ :starting_concentration, :target_concentration, :is_diluent,
                                     :mixable_type, :mixable_id, :vendor_id, :supplier_id ]
        params.require(:data)
              .permit(:label, :description, :organization_id,
                      :mixture_components_attributes => [ *mixture_component_params ])
      end
    end
  end
end
