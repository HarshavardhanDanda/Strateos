module Api
  module V1
    class LibrariesController < Api::ApiController
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
              name: { type: "string" }
            }
          },
          relationships: {
            type: "object", required: [ "compounds" ], additionalProperties: false,
            properties: {
              compounds: {
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

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [], additionalProperties: false,
        properties: {
          id: {
            type: "string"
          },
          type: {
            type: "string"
          },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              name: { type: "string" }
            }
          },
          relationships: {
            type: "object", required: [ "compounds" ], additionalProperties: false,
            properties: {
              compounds: {
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

      CREATE_RELATIONSHIP_SCHEMA = {
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

        scope = Pundit.policy_scope!(pundit_user, Library)

        unless scope.find_by(data[:attributes], organization: @organization).nil?
          return render_error("Conflict", status: :conflict, code: "409",
                              detail: "Library with name '#{data[:attributes][:name]}' already exists")
        end

        library = Library.new(data[:attributes])
        library.organization = @organization

        authorize(library, :create?)

        compounds = data.dig(:relationships, :compounds, :data)
        compound_link_ids = compounds.present? ? compounds.pluck(:id) : []

        begin
          validate_compound_links(compound_link_ids)
        rescue StandardError => e
          return render_error("Forbidden", status: :forbidden, code: "403", detail: e.message)
        end
        save_library(library, compound_link_ids)
      end

      def update
        id = params.require(:id)
        scope = Pundit.policy_scope!(pundit_user, Library)
        library = scope.find(id)

        data = params.require(:data).to_unsafe_h
        validate_json(UPDATE_SCHEMA, data)

        authorize(library, :update?)

        library.assign_attributes(data[:attributes])

        compounds = data.dig(:relationships, :compounds, :data)
        compound_link_ids = compounds.present? ? compounds.pluck(:id) : library.compound_links.pluck(:id)

        begin
          validate_compound_links(compound_link_ids)
        rescue StandardError => e
          return render_error("Forbidden", status: :forbidden, code: "403", detail: e.message)
        end
        save_library(library, compound_link_ids)
      end

      def create_relationship
        id = params.require(:library_id)
        scope = Pundit.policy_scope!(pundit_user, Library)
        library = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_RELATIONSHIP_SCHEMA, data)

        authorize(library, :update?)

        compound_link_ids = data.present? ? data.pluck(:id) : []

        begin
          validate_compound_links(compound_link_ids)
        rescue StandardError => e
          return render_error("Forbidden", status: :forbidden, code: "403", detail: e.message)
        end
        existing_compound_link_ids = library.compound_links.pluck(:id)

        # doing a loop here to capture the idx of the compound with an issue, to be use on the error response in the
        # future
        compound_link_ids.each_with_index do |compound_link_id, idx|
          if existing_compound_link_ids.include?(compound_link_id)
            message = "Compound with id '#{compound_link_id}' is already associated with this library"
            return render_error("Conflict", status: :conflict, code: "409", detail: message)
          end
        end

        save_library(library, existing_compound_link_ids + (compound_link_ids - existing_compound_link_ids))
      end

      def destroy_relationship
        id = params.require(:library_id)
        scope = Pundit.policy_scope!(pundit_user, Library)
        library = scope.find(id)

        data = params.require(:data).map(&:to_unsafe_h)
        validate_json(CREATE_RELATIONSHIP_SCHEMA, data)

        authorize(library, :update?)

        compound_link_ids = data.present? ? data.pluck(:id) : []

        begin
          validate_compound_links(compound_link_ids)
        rescue StandardError => e
          return render_error("Forbidden", status: :forbidden, code: "403", detail: e.message)
        end

        not_associated_compound_link_ids = compound_link_ids - library.compound_links.pluck(:id)

        if (count = not_associated_compound_link_ids.count) > 0
          error_message = "Compound#{count > 1 ? 's' : ''} with id#{count > 1 ? 's' : ''}: "\
                          "'#{not_associated_compound_link_ids.join(', ')}' "\
                          "#{count > 1 ? 'are' : 'is'} not associated to library '#{id}'"
          return render_error("Invalid request", status: :bad_request, code: "400", detail: error_message)
        end

        save_library(library, library.compound_links.pluck(:id) - compound_link_ids)
      end

      private

      def validate_compound_links(compound_link_ids)
        current_org_compound_link_ids = CompoundServiceFacade::GetCompoundsByIds.call(compound_link_ids).pluck(:id)
        compound_links_different_org_ids = compound_link_ids - current_org_compound_link_ids

        if (count = compound_links_different_org_ids.count) > 0
          error_message = "Compound#{count > 1 ? 's' : ''} with id#{count > 1 ? 's' : ''}: "\
                          "'#{compound_links_different_org_ids.join(', ')}' "\
                          "belong#{count > 1 ? '' : 's'} to a different organization"

          raise error_message
        end
      end

      def save_library(library, compound_link_ids)
        ActiveRecord::Base.transaction do
          library.save!
          library.compound_links = compound_link_ids.map { |id| CompoundServiceFacade::GetCompound.call(id,
            CompoundServiceFacade::Scope::PUNDIT_SCOPE) }
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::LibraryResource, include: [ 'compounds' ])
          library = Api::V1::LibraryResource.new(library, context)
          json = serializer.serialize_to_hash(library)

          render json: json, status: [ 'create', 'create_relationship' ].include?(self.action_name) ? :created : :ok
        end
      end
    end
  end
end
