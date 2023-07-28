module Api
  module V1
    class LaunchRequestsController < Api::ApiController

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [], additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              input_file_attributes: { "type": "object" }
            }
          }
        }
      }

      def update
        launch_request = LaunchRequest.find(params[:id])
        data = params.require(:data).to_unsafe_hash
        validate_json(UPDATE_SCHEMA, data)

        authorize(launch_request, :update?)

        attrs = data[:attributes]

        current_input_file_attributes = {}
        if !launch_request.input_file_attributes.nil?
          current_input_file_attributes = launch_request.input_file_attributes.symbolize_keys
        end

        input_file_attributes_param = attrs[:input_file_attributes].symbolize_keys

        updated_input_file_attributes = { **current_input_file_attributes, **input_file_attributes_param }

        if launch_request.update({ input_file_attributes: updated_input_file_attributes })
          render json: launch_request
        else
          render json: launch_request.errors, status: :unprocessable_entity
        end
      end
    end
  end
end
