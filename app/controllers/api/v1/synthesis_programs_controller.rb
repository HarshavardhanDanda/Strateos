module Api
  module V1
    class SynthesisProgramsController < Api::ApiController
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

        synthesis_program = SynthesisProgram.new(**data[:attributes], organization: organization)
        authorize(synthesis_program, :create?)

        synthesis_program.save!

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisProgramResource)
        synthesis_program = Api::V1::SynthesisProgramResource.new(synthesis_program, context)
        json = serializer.serialize_to_hash(synthesis_program)

        render json: json, status: :created
      end

      def create_relationship
        id = params.require(:synthesis_program_id)
        scope = Pundit.policy_scope!(pundit_user, SynthesisProgram)
        synthesis_program = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_DESTROY_RELATIONSHIP_SCHEMA, data)

        authorize(synthesis_program, :update?)

        ActiveRecord::Base.transaction do
          data.each do |item_request|
            item_type = item_request[:type].camelcase.singularize
            item_class = item_type.constantize
            item = item_class.find(item_request[:id])
            synthesis_program.synthesis_program_items.create!(item: item, item_type: item_type)
          end
        end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisProgramResource,
                                                     include: [ self.params[:relationship] ])
        synthesis_program = Api::V1::SynthesisProgramResource.new(synthesis_program, context)
        json = serializer.serialize_to_hash(synthesis_program)
        render json: json, status: :created
      end

      def destroy_relationship
        id = params.require(:synthesis_program_id)
        scope = Pundit.policy_scope!(pundit_user, SynthesisProgram)
        synthesis_program = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_DESTROY_RELATIONSHIP_SCHEMA, data)

        authorize(synthesis_program, :update?)

        ActiveRecord::Base.transaction do
          data.each do |item_request|
            item_type = item_request[:type].camelcase.singularize
            item_class = item_type.constantize
            item = item_class.find(item_request[:id])
            synthesis_program_item = SynthesisProgramItem.find_by(synthesis_program: synthesis_program, item: item)
            if synthesis_program_item.nil?
              synthesis_program_item = SynthesisProgramItem.new
              synthesis_program_item.errors.add(item_type.underscore.to_sym, :no_relationship, value: item_request[:id])
              raise ActiveRecord::RecordInvalid.new(synthesis_program_item)
            end
            synthesis_program_item.destroy!
          end
        end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::SynthesisProgramResource,
                                                     include: [ self.params[:relationship] ])
        synthesis_program = Api::V1::SynthesisProgramResource.new(synthesis_program, context)
        json = serializer.serialize_to_hash(synthesis_program)
        render json: json, status: :ok
      end
    end
  end
end
