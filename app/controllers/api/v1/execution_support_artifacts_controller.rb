module Api
  module V1
    class ExecutionSupportArtifactsController < Api::ApiController
      GENERATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object", required: %w[run_id instruction_ids],
        properties: {
          comment: { type: "string" },
          instruction_ids: {
            type: "array",
            items: { type: "string" }
          },
          operation: { type: "string" },
          run_id: { type: "string" }
        }
      }

      def generate
        inputs = params.to_unsafe_hash
        validate_json(GENERATE_SCHEMA, inputs)

        run = Run.includes(:project).find(inputs[:run_id])
        instructions = run.instructions.where(op: inputs[:operation]).find(inputs[:instruction_ids])

        esa = ExecutionSupportArtifact.generate(run, instructions)

        # generate json response
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::ExecutionSupportArtifactResource)
        resource = Api::V1::ExecutionSupportArtifactResource.new(esa, context)
        json = serializer.serialize_to_hash(resource)

        render json: json
      end
    end
  end
end
