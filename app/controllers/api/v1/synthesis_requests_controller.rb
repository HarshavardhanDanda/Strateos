module Api
  module V1
    class SynthesisRequestsController < Api::ApiController
      CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes", "type" ], additionalProperties: false,
        properties: {
          type: {
            type: "string"
          },
          attributes: {
            type: "object", required: [ "name" ], additionalProperties: false,
            properties: {
              name: { type: "string" },
              synthesis_program_id: { type: "string" },
              library_id: { type: "string" },
              organization_id: { type: "string" }
            }
          }
        }
      }

      CREATE_DESTROY_RELATIONSHIP_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "array",
        items: {
          type: "object", required: [ "type", "id" ], additionalProperties: false,
          properties: {
            type: { type: "string" }, id: { type: "string" }
          }
        }
      }

      def create
        data = params.require(:data).to_unsafe_h
        validate_json(CREATE_SCHEMA, data)

        organization = if data[:attributes][:organization_id] && data[:attributes][:organization_id] != @organization.id
                         organization = Organization.find(data[:attributes][:organization_id])
                         authorize(organization, :org_is_consumer_of_allowed_labs)
                         organization
                       else
                         @organization
                       end

        scope = Pundit.policy_scope!(pundit_user, SynthesisProgram)
        synthesis_program = if data[:attributes][:synthesis_program_id].present?
                              scope.find(data[:attributes][:synthesis_program_id])
                            else
                              nil
                            end

        authorize(synthesis_program, :show?) if synthesis_program.present?

        scope = Pundit.policy_scope!(pundit_user, Library)
        library = data[:attributes][:library_id].present? ? scope.find(data[:attributes][:library_id]) : nil

        authorize(library, :show?) if library.present?

        synthesis_request = SynthesisRequest.new(
          name: data[:attributes][:name],
          synthesis_program: synthesis_program,
          library: library,
          organization: organization
        )

        authorize(synthesis_request, :create?)

        synthesis_request.save!

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisRequestResource)
        synthesis_request = Api::V1::SynthesisRequestResource.new(synthesis_request, context)
        json = serializer.serialize_to_hash(synthesis_request)

        render json: json, status: :created
      end

      def create_relationship
        id = params.require(:synthesis_request_id)
        scope = Pundit.policy_scope!(pundit_user, SynthesisRequest)
        synthesis_request = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_DESTROY_RELATIONSHIP_SCHEMA, data)

        authorize(synthesis_request, :update?)

        scope = Pundit.policy_scope!(pundit_user, Batch)

        ActiveRecord::Base.transaction do
          data.each do |batch_request|
            batch = scope.find(batch_request[:id])
            authorize(batch, :show?)
            synthesis_request.synthesis_requests_batches.create!(batch: batch, organization: @organization)
          end
        end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisRequestResource,
                                                     include: [ self.params[:relationship] ])
        synthesis_request = Api::V1::SynthesisRequestResource.new(synthesis_request, context)
        json = serializer.serialize_to_hash(synthesis_request)
        render json: json, status: :created
      end

      def destroy_relationship
        id = params.require(:synthesis_request_id)
        scope = Pundit.policy_scope!(pundit_user, SynthesisRequest)
        synthesis_request = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_DESTROY_RELATIONSHIP_SCHEMA, data)

        authorize(synthesis_request, :update?)

        batch_scope = Pundit.policy_scope!(pundit_user, Batch)

        ActiveRecord::Base.transaction do
          data.each do |batch_request|
            batch = batch_scope.find(batch_request[:id])
            authorize(batch, :show?)
            synthesis_request_batch = SynthesisRequestBatch.find_by(batch: batch, synthesis_request: synthesis_request)
            if synthesis_request_batch.nil?
              synthesis_request_batch = SynthesisRequestBatch.new
              synthesis_request_batch.errors.add(:batch, :no_relationship, value: batch_request[:id])
              raise ActiveRecord::RecordInvalid.new(synthesis_request_batch)
            end
            synthesis_request_batch.destroy!
          end
        end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisRequestResource,
                                                     include: [ self.params[:relationship] ])
        synthesis_request = Api::V1::SynthesisRequestResource.new(synthesis_request, context)
        json = serializer.serialize_to_hash(synthesis_request)
        render json: json, status: :ok
      end
    end
  end
end
