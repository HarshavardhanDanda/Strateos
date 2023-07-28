module Api
  module V2
    class AliquotsController < Api::ApiController

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
          type: "object", required: [], additionalProperties: false,
          properties: {
            type: { type: "string" },
            id: { type: "string" },

            attributes: {
              type: "object", required: [], additionalProperties: false,
              properties: {
                name:         { type: "string" },
                volume_ul:    { type: "number" },
                mass_mg:    { type: "number" },
                resource_id:  { type: "string, null" },
                compound_ids: { type: "array", items: { "type": "string" }},

                properties: {
                  type: "object",
                  additionalProperties: { "type": "string" }
                }
              }
            },

            relationships: {
              type: "object", required: [], additionalProperties: false,
              properties: {
                compounds: {
                  type: "object", required: [ "data" ], additionalProperties: false,
                  properties: {
                    data: { type: "array", items: {
                      type: "object",
                      properties: {
                        compound_link_id: { type: "string" },
                        concentration: { type: "number, null,string",
                          pattern: "^#{ManifestUtil::POS_FLOAT_PATTERN}$",
                        },
                        solubility_flag: { type: "boolean, null" }
                      },
                      additionalProperties: false,
                      required: [ "compound_link_id" ]
                    }}
                  }
                }
              }
            },

            actions: {
              type: "object", required: [], additionalProperties: false,
              properties: {
                add_properties: {
                  type: "object",
                  additionalProperties: { "type": "string" }
                },

                delete_properties: {
                  type: "array",
                  items: { "type": "string" }
                }
              }
            }
          }
      }

      def update
        id = params.require(:id)
        data = params.require(:data).to_unsafe_hash

        validate_json(UPDATE_SCHEMA, data)

        aliquot = Aliquot.with_deleted.find(id)
        error = nil
        authorize(aliquot, :update?)

        Searchkick.callbacks(:inline) do
          aliquot, error = update_internal(aliquot, data)
        end
        if error
          render_api_exception(error)
        else
          # generate json response
          serializer = JSONAPI::ResourceSerializer.new(Api::V2::AliquotResource)
          resource = Api::V2::AliquotResource.new(aliquot, context)
          json = serializer.serialize_to_hash(resource)

          render json: json
        end
      end

      private

      # Shared logic for updating and saving an aliquot
      #
      # @param aliquot [Aliquot] An authorized aliquot
      # @param data [Hash] Validated data as defined in the UPDATE_SCHEMA
      #
      # @return [Aliquot, Error]
      def update_internal(aliquot, data)
        # process attributes
        aliquot.assign_attributes(data[:attributes] || {})

        # process actions first
        actions = data[:actions] || {}
        aliquot.properties.merge!(actions[:add_properties] || {})
        aliquot.properties.except!(*(actions[:delete_properties] || []))

        # If resource_id changed verify that resource id exists and is valid
        resource_id = data.dig(:attributes, :resource_id)
        if resource_id
          resource = Resource.find_by(id: resource_id)

          if resource.nil?
            e = JSONAPI::Exceptions::InvalidFieldValue.new(:resource_id, resource_id)
            return [ aliquot, e ]
          end

          authorize(resource, :show?)
        end

        # Update compounds
        aliquot_compound_links_properties = data.dig(:relationships, :compounds, :data)

        compound_link_ids = nil
        if aliquot_compound_links_properties
          compound_link_ids = aliquot_compound_links_properties.pluck(:compound_link_id)
        end

        compound_links = nil
        if compound_link_ids
          compound_links = CompoundServiceFacade::GetCompoundsByIds.call(compound_link_ids,
                                                                         CompoundServiceFacade::Scope::PUNDIT_SCOPE)

          if compound_links.size != compound_link_ids.size
            missing_ids = compound_link_ids - compound_links.map(&:id)
            e = JSONAPI::Exceptions::InvalidFieldValue.new(:compound_ids, missing_ids)
            return [ aliquot, e ]
          end

          # Check blacklisted hazard exists in aliquot's container location
          location = aliquot.container.location
          if !location.nil?
            all_location_hazards = location.all_blacklisted_hazards
            all_compound_hazards = compound_links.flat_map { |cl| cl.compound&.existing_flags }.compact
            all_compound_hazards.each do |hazard|
              if all_location_hazards.include? hazard
                e = BadJSON.new([ "Aliquot contains '#{hazard}' flag which is blacklisted" ])
                return [ aliquot, e ]
              end
            end
          end

          compound_links.each { |cl| authorize(cl, :show?) }
        end

        # update aliquot composition
        if compound_links
          authorize(AliquotCompoundLink, :update?)
          aliquot.set_composition_with_properties(aliquot_compound_links_properties)
        end

        if aliquot.save!
          # create an aliquot effect for manual volume changes
          volume_ul = data.dig(:attributes, :volume_ul)
          mass_mg = data.dig(:attributes, :mass_mg)
          user = current_user

          # create aliquot effect if manual volume change
          unless volume_ul.nil?
            effect = aliquot.make_manual_adjustment_effect(user.id, adjusted_volume_ul: volume_ul)
            effect.save
          end

          unless mass_mg.nil?
            effect = aliquot.make_manual_adjustment_effect(user.id, adjusted_mass_mg: mass_mg)
            effect.save
          end

          [ aliquot, nil ]
        else
          [ aliquot, JSONAPI::Exceptions::ValidationErrors.new(resource) ]
        end
      end

    end
  end
end
