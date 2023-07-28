module Api
  module V1
    class ContainerTypesController < Api::ApiController
      CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes" ], additionalProperties: false,
        properties: {
          attributes: ContainerType::SCHEMA_CREATION,
          actions: {
            dry_run: { type: 'boolean' }
          },
          type: {
            type: "string"
          }
        }
      }

      def schema_creation
        authorize(ContainerType.new, :create?)
        render json: ContainerType::SCHEMA_CREATION, status: :ok
      end

      def create
        authorize(ContainerType.new, :create?)

        data = params.require(:data).to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)
        ctype = ContainerType.new(data['attributes'])

        if data.dig(:actions, :dry_run)
          return render json: serialize_ctype(ctype, context), status: :ok
        end

        ctype.id = data['attributes']['shortname']
        if ctype.save
          render json: serialize_ctype(ctype, context), status: :created
        else
          resource = Api::V1::ContainerTypeResource.new(ctype, context)
          error = JSONAPI::Exceptions::ValidationErrors.new(resource)
          render_api_exception(error)
        end
      end

      private

      def serialize_ctype(container_type, context)
        resource = Api::V1::ContainerTypeResource.new(container_type, context)
        serializer = Api::V1::ContainerTypeResource.serializer()
        serializer.serialize_to_hash(resource)
      end

      def is_public_url?
         [ 'index', 'show' ].include?(action_name)
      end
    end
  end
end
