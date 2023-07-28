module Api
  module V1
    class DeviceEventsController < Api::ApiController
      CREATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          type: {
            type: "string"
          },
          attributes: {
            type: "object",
            properties: {
              date: {
                type: "string"
              },
              event_type: {
                type: "string"
              },
              report_url: {
                type: "string"
              }
            },
            required: [
              "date",
              "event_type",
              "report_url"
            ]
          }
        },
        required: [
          "attributes"
        ]
      }

      def create
        params_hash = params.to_unsafe_hash
        data = params_hash[:data]
        validate_json(CREATE_SCHEMA, data)

        device_event_params = data[:attributes]
        device_event_params[:device_id] = params_hash[:device_id]

        device_event = DeviceEvent.new(device_event_params)
        authorize(device_event, :create?)

        if device_event.save
          render json: serialize_device_event(device_event), status: :created
        else
          render json: device_event.errors, status: :unprocessable_entity
        end
      end

      private

      def serialize_device_event(device_event)
        resource = Api::V1::DeviceEventResource.new(device_event, context)
        serializer = Api::V1::DeviceEventResource.serializer
        serializer.serialize_to_hash(resource)
      end
    end
  end
end
