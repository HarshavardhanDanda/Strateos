module Api
  module V1
    class ImplementationItemsController < Api::ApiController

      UPDATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "attributes": {
            "type": "object",
            "properties": {
              "implementation_item": {
                "type": "object",
                "properties": {
                  "shipment_id": {
                    "type": "string"
                  },
                  "created_at": {
                    "type": "string"
                  },
                  "quantity": {
                    "type": "integer"
                  },
                  "name": {
                    "type": "string"
                  },
                  "note": {
                    "type": [ "string", "null" ]
                  },
                  "checked_in_at": {
                    "type": [ "string", "boolean", "null" ]
                  },
                  "location": {
                    "type": [ "string", "null" ]
                  },
                  "storage_condition": {
                    "type": "string"
                  },
                  "container_type": {
                    "type": "string"
                  },
                  "type": {
                    "type": "string"
                  },
                  "id": {
                    "type": "string"
                  }
                },
                "required": [
                  "shipment_id",
                  "created_at",
                  "quantity",
                  "name",
                  "note",
                  "checked_in_at",
                  "storage_condition",
                  "container_type",
                  "type",
                  "id"
                ]
              }
            },
            "required": [
              "implementation_item"
            ]
          }
        },
        "required": [
          "attributes"
        ]
      }

      def update
        validate_json(UPDATE_SCHEMA, params[:data].to_unsafe_hash)
        implementation_item = ImplementationItem.find(params.require(:id))
        authorize(implementation_item, :update?)

        if implementation_item.update(implementation_item_params)
          render json:  serialize_implementation_item(implementation_item)
        else
          render json: implementation_item.errors, status: :unprocessable_entity
        end
      end

      def implementation_item_params
        params[:data][:attributes].require(:implementation_item).permit(
          :name,
          :quantity,
          :container_type,
          :storage_condition,
          :note,
          :checked_in_at,
          :location
        )
      end

      private

      def serialize_implementation_item(implementation_item)
        resource = Api::V1::ImplementationItemResource.new(implementation_item, context)
        serializer = Api::V1::ImplementationItemResource.serializer
        serializer.serialize_to_hash(resource)
      end
    end
  end
end
