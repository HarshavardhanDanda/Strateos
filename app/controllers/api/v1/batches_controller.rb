module Api
  module V1
    class BatchesController < Api::ApiController

      CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes", "relationships" ], additionalProperties: false,
        properties: {
          type: {
            type: "string"
          },
          attributes: {
            type: "object", required: [ "reaction_id" ], additionalProperties: false,
            properties: {
              reaction_id: { type: "string,null" },
              name: { type: "string,null" },
              created_by: { type: "string,null" },
              purity: {
                type: "number,null, string",
                pattern: "^#{ManifestUtil::POS_FLOAT_PATTERN}$"
              },
              post_purification_mass_yield_mg: {
                type: "number,null,string",
                pattern: "^#{ManifestUtil::POS_FLOAT_PATTERN}$"
              },
              product_type: {
                type: "string",
                enum: Batch::PRODUCT_TYPE.values
              },
              contextual_custom_properties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" }
                  },
                  required: [ "key", "value" ]
                }
              }
            }
          },
          relationships: {
            type: "object", required: [ "compound" ], additionalProperties: false,
            properties: {
              compound: {
                type: "object", required: [ "data" ], additionalProperties: false,
                properties: {
                  data: {
                    type: "object", required: [ "type", "id" ], additionalProperties: false,
                    properties: {
                      type: { type: "string" }, id: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "type", "id" ], additionalProperties: false,
        properties: {
          type: { type: "string" },
          id: { type: "string" },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              created_by: {
                type: "string,null"
              },
              purity: {
                type: "number, null, string",
                pattern: "^#{ManifestUtil::POS_FLOAT_PATTERN}$"
              },
              post_purification_mass_yield_mg: {
                type: "number, null,string",
                pattern: "^#{ManifestUtil::POS_FLOAT_PATTERN}$"
              },
              product_type: {
                type: "string",
                enum: Batch::PRODUCT_TYPE.values
              }
            }
          },
          relationships: {
            type: "object", required: [ "aliquots" ], additionalProperties: false,
            properties: {
              aliquots: {
                type: "object", required: [ "data" ], additionalProperties: false,
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object", required: [ "type", "id" ], additionalProperties: false,
                      properties: {
                        type: { type: "string" }, id: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      def create
        data = params.require(:data).to_unsafe_h
        validate_json(CREATE_SCHEMA, data)

        attributes = data[:attributes]
        contextual_custom_property_params = attributes[:contextual_custom_properties] || []
        batch = Batch.new(attributes.except!(:contextual_custom_properties))
        batch.organization = @organization
        compound_link_id = data.dig(:relationships, :compound, :data, :id)


        batch.compound_link_id = compound_link_id
        authorize(batch, :create?)

        ActiveRecord::Base.transaction do
          if batch.save!
            contextual_custom_property_params.each do |ccp_param|
              ContextualCustomProperty.upsert_with_key(ccp_param[:key], ccp_param[:value], batch, @organization.id)
            end
            serializer = JSONAPI::ResourceSerializer.new(Api::V1::BatchResource)
            batch = Api::V1::BatchResource.new(batch, context)
            json = serializer.serialize_to_hash(batch)

            render json: json, status: :created
          end
        end

      end

      def update
        data = params.require(:data).to_unsafe_h
        id = params.require(:id)
        batch = Batch.find(id)
        containers = Set.new
        aliquot_compound_links = []

        validate_json(UPDATE_SCHEMA, data)
        aliquots = data.dig(:relationships, :aliquots, :data)
        authorize(batch, :update?)

        if aliquots
          unless batch.aliquots_compound_links.empty?
            batch.aliquots.each do |aliquot|
              containers.add(aliquot.container)
            end
          end

          authorize(batch, :can_link_aliquots?)
          aliquot_compound_links, errors = get_aliquot_compound_links(batch.compound_link, aliquots)
          aliquot_compound_links.each do |links|
            containers.add(links.aliquot.container)
          end
          unless errors.empty?
            count = errors.count
            error_message = "AliquotCompoundLink#{count > 1 ? 's' : ''} with aliquot_id#{count > 1 ? 's' : ''}: "\
                            "#{errors.pluck(:id).join(', ')} and compound_link_id #{batch.compound_link[:id]} "\
                            "does not exist"
            return render json: { errors: [ error_message ] }, status: :not_found
          end

          aliquots_different_org = validate_organization(aliquot_compound_links.map(&:aliquot),
                                                         batch.organization)
          unless aliquots_different_org.empty?
            count = aliquots_different_org.count
            error_message = "Aliquot#{count > 1 ? 's' : ''} with aliquot_id#{count > 1 ? 's' : ''}: "\
                            "#{aliquots_different_org.pluck(:id).join(', ')} belong#{count > 1 ? 's' : ''} "\
                            "to a different organization. "
            return render json: { errors: [ error_message ] }, status: :forbidden
          end
        end

        batch.assign_attributes(data[:attributes] || {})

        ActiveRecord::Base.transaction do
          batch.save!
          unless aliquot_compound_links.empty?
            batch.aliquots_compound_links = aliquot_compound_links
            containers.each(&:reindex)
          end
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::BatchResource, include: aliquots ? [ 'aliquots' ] : [])
          batch = Api::V1::BatchResource.new(batch, context)
          json = serializer.serialize_to_hash(batch)

          render json: json, status: :ok
        end
      end

      private

      def get_aliquot_compound_links(compound_link, aliquots)
        aliquot_compound_links = []
        errors = []
        aliquots.each do |aliquot|
          aliquot_compound_link = AliquotCompoundLink.find_by(aliquot_id: aliquot[:id],
                                                              compound_link_id: compound_link[:id])
          aliquot_compound_link.nil? ? errors.push(aliquot) : aliquot_compound_links.push(aliquot_compound_link)
        end

        [ aliquot_compound_links, errors ]
      end

      def validate_organization(aliquots, organization)
        different_org = []
        aliquots.each do |aliquot|
          if aliquot.container.organization != organization
            different_org.push(aliquot)
          end
        end
        different_org
      end

    end
  end
end
