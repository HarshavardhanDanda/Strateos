module Api
  module V1
    class FavoritesController < Api::ApiController

      CREATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          attributes: {
            type: "object",
            properties: {
              favorable_id: {
                "type": "string"
              },
              favorable_type: {
                "enum": [ "Project", "Protocol" ]
              }
            },
            required: [
              "favorable_id",
              "favorable_type"
            ]
          }
        },
        required: [
          "attributes"
        ]
      }

      def create
        validate_json(CREATE_SCHEMA, params[:data].to_unsafe_hash)

        favorable_type = params[:data][:attributes][:favorable_type]
        favorable_id = params[:data][:attributes][:favorable_id]

        favorable = if favorable_type == 'Project'
                      Project.find(favorable_id)
                    else
                      Protocol.find(favorable_id)
                    end

        authorize(favorable, :show?)

        if current_user
          if current_user.favorites.exists?(favorable: favorable)
            return head :bad_request
          end
          favorite = current_user.favorites.create(favorable: favorable)
        else
          return head :forbidden
        end
        render json: serialize_favorite(favorite), status: :created
      end

      private

      def serialize_favorite(favorite)
        resource = Api::V1::FavoriteResource.new(favorite, context)
        serializer = Api::V1::FavoriteResource.serializer
        serializer.serialize_to_hash(resource)
      end

    end
  end
end
