module Api
  module V1
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

          # can set compounds by passing a set of compound_ids
          relationships: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              compounds: {
                type: "object", required: [ "data" ], additionalProperties: false,
                properties: {
                  data: { type: "array", items: { "type": "string" }}
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
        id   = params.require(:id)
        data = params.require(:data).to_unsafe_hash

        validate_json(UPDATE_SCHEMA, data)

        aliquot = Aliquot.with_deleted.find(id)
        authorize(aliquot, :update?)

        aliquot, error = update_internal(aliquot, data)

        if error
          render_api_exception(error)
        else
          # generate json response
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::AliquotResource)
          resource = Api::V1::AliquotResource.new(aliquot, context)
          json = serializer.serialize_to_hash(resource)

          render json: json
        end
      end

      def update_well
        container_id = params.require(:container_id)
        well_idx     = params.require(:well_idx)
        aliquot      = Aliquot.find_by(container_id: container_id, well_idx: well_idx)
        authorize(aliquot, :update?)

        attrs = params.require(:aliquot).permit(
          :name,
          :resource,
          :resource_id,
          :volume_ul,
          :mass_mg,
          { :add_properties => [ [ :key, :value ] ] },
          { :delete_properties => [] }
        )

        if aliquot.update(attrs)
          render json: aliquot.as_json(Aliquot.flat_json)
        else
          render json: aliquot.errors, status: :unprocessable_entity
        end
      end

      # Mapping from aliquot_id -> UPDATE_SCHEMA
      BATCH_UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object",
        minProperties: 1, maxProperties: 400,
        additionalProperties: UPDATE_SCHEMA
      }
      def batch_update
        data = params.require(:data).to_unsafe_hash

        validate_json(BATCH_UPDATE_SCHEMA, data)

        aliquot_ids = data.keys.uniq
        aliquots    = Aliquot.with_deleted.find(aliquot_ids)

        aliquots.each do |aliquot|
          authorize(aliquot, :update?)
        end

        success_aliquots = []
        errors = []

        aliquots.each do |aliquot|
          aliquot, error = update_internal(aliquot, data[aliquot.id])

          if error
            errors << {
              title: "Unable to update aliquot #{aliquot.id}",
              detail: error.message,
              status: 400
            }
          else
            success_aliquots << aliquot
          end
        end

        # generate json response
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::AliquotResource)
        resources = aliquots.map { |a| Api::V1::AliquotResource.new(a, context) }
        json = serializer.serialize_to_hash(resources)

        # There are currently discussions on how to best represent partial success, using meta is one option
        # https://gist.github.com/e0ipso/732712c3e573a6af1d83b25b9f0269c8
        if !errors.empty?
          json[:meta] = { errors: errors }
        end

        render json: json
      end

      # DEPRECATED:
      #
      # Remove in the future. Users should use the aliquot Update route instead.
      def modify_properties
        id   = params.require(:id)
        data = params.require(:data)

        # modify params to match aliquots update route
        params[:data] = ActionController::Parameters.new({
          id: id,
          type: 'aliquots',
          actions: {
            add_properties: data[:set],
            delete_properties: data[:delete]
          }
        })

        # call update route
        self.update
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
        compound_link_ids = data.dig(:relationships, :compounds, :data)


        compound_links    = nil
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
            all_compound_hazards = compound_links.flat_map { |cl| cl.compound.existing_flags }
            all_compound_hazards.each do |hazard|
              if all_location_hazards.include? hazard
                e = BadJSON.new([ "Aliquot contains '#{hazard}' flag which is blacklisted" ])
                return [ aliquot, e ]
              end
            end
          end

          compound_links.each { |cl| authorize(cl, :show?) }
        end

        if aliquot.save
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

          # update aliquot composition
          if compound_links
            aliquot.set_composition(compound_links)
          end

          [ aliquot, nil ]
        else
          [ aliquot, JSONAPI::Exceptions::ValidationErrors.new(resource) ]
        end
      end
    end
  end
end
