module Api
  module V1
    class DevicesController < Api::ApiController

      CREATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          type: {
            type: "string"
          },
          id: {
            type: "string"
          },
          attributes: {
            type: "object",
            properties: {
              model: {
                type: "string"
              },
              manufacturer: {
                type: "string"
              },
              name: {
                type: "string"
              },
              purchased_at: {
                type: "string"
              },
              manufactured_at: {
                type: "string"
              },
              serial_number: {
                type: "string"
              },
              work_unit_id: {
                type: "string"
              }

            },
            required: [
              "name",
              "work_unit_id"
            ]
          }
        },
        required: [
          "id",
          "attributes"
        ]
      }

      def create
        data = params[:data].to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)

        device_params = data[:attributes]
        device_params[:id] = data[:id]

        device = Device.new(device_params)
        authorize(device, :create?)

        if device.save
          render json: serialize_device(device), status: :created
        else
          render json: device.errors, status: :unprocessable_entity
        end
      end

      private

      def serialize_device(device)
        resource = Api::V1::DeviceResource.new(device, context)
        serializer = Api::V1::DeviceResource.serializer
        serializer.serialize_to_hash(resource)
      end
    end
  end
end
