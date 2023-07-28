module Api
  module V1
    class LocationsController < Api::ApiController

      LOCATION_SCHEMA = {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: {
          location_type_id:  { "type": "string" },
          name: { "type": "string" },
          parent_id: { "type": [ "string", "null" ] },
          lab_id: { "type": "string" },
          position: { "type": "string" },
          properties: {
            type: "object",
            additionalProperties: { "type": "string" }
          },
          blacklist: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      }

      LOCATION_UPDATE_SCHEMA = {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: {
          name: { "type": "string" },
          newPosition: { "type": "string" },
          parent_id: { "type": [ "string", "null" ] },
          location_type_id: { "type": "string" },
          blacklist: {
            type: "array",
            items: {
              type: "string"
            }
          },
          properties: {
            type: "object",
            additionalProperties: { "type": "string" }
          }
        }
      }

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [], additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              location: LOCATION_UPDATE_SCHEMA,
              json_format: { "type": "string" }
            }
          }
        }
      }

      CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes" ], additionalProperties: false,
        properties: {
          type: {
            type: "string"
          },
          attributes: {
            type: "object", required: [ 'location' ], additionalProperties: false,
            properties: {
              location: LOCATION_SCHEMA,
              rows: { "type": [ "integer", "null" ] },
              cols: { "type": [ "integer", "null" ] },
              cell_height_mm: { "type": [ "integer", "null" ] },
              json_format: { "type": "string" }
            }
          }
        }
      }

      def root
        authorize(Location.new, :index?)
        scope = Pundit.policy_scope!(pundit_user, Location)
        render json: {
          id: nil,
          name: 'Root',
          ancestors: [],
          children: scope.where(parent_id: nil).as_json(Location.short_json),
          containers: []
        }
      end

      def load_deep_root
        authorize(Location.new, :index?)
        scope = Pundit.policy_scope!(pundit_user, Location)
        render json: scope.children_deep(nil).as_json(scope.short_json)
      end

      def load_deep
        location_id = params.require(:id)
        location = Location.find(location_id)
        authorize(location, :show?)
        scope = Pundit.policy_scope!(pundit_user, Location)
        locations = [ location ] + Location.children_deep(location_id)

        render json: locations.as_json(scope.short_json)
      end

      def load_deep_containers
        location = Location.find(params[:id])
        authorize(location, :show?)
        container_scope = Pundit.policy_scope!(pundit_user, Container)
        location_id = params[:id]
        locations   = Location.children_deep(location_id)
        containers  = container_scope.where(location_id: locations.map(&:id))

        render json: containers.as_json(Container.mini_json)
      end

      def create
        data = params.require(:data).to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)
        attributes = data[:attributes]
        location_type = LocationType.find_by(id: attributes[:location][:location_type_id])
        lab_id = attributes[:location][:lab_id]
        authorize(Location.new(lab_id: lab_id), :create?)
        if [ 'tiso', 'tiso_column' ].include? location_type
          authorize(Location.new(lab_id: lab_id), :manage_tisos?)
        end
        location, errors =
          case location_type.category
          when 'box'
            LocationService.create_box_location(attributes, attributes[:rows], attributes[:cols])
          when 'rack'
            LocationService.create_rack_location(
              attributes,
              attributes[:rows],
              attributes[:cols],
              attributes[:cell_height_mm]
            )
          else
            LocationService.create_location(attributes)
          end
        json_format =
          if params[:json_format] == 'flat'
            Location.flat_json
          elsif params[:json_format] == 'short'
            Location.short_json
          else
            Location.full_json
          end

        if errors.empty?
          render json: location.as_json(json_format), status: :created
        else
          render json: { errors: errors }, status: :unprocessable_entity
        end

      end

      def update
        data = params.require(:data).to_unsafe_hash
        validate_json(UPDATE_SCHEMA, data)
        location = Location.find(params.require(:id))
        authorize(location, :update?)
        location, errors = LocationService.update_location(data[:attributes], params.require(:id))
        json_format = params[:json_format] == 'flat' ? Location.flat_json : Location.full_json

        if errors.empty?
          render json: location.as_json(json_format)
        else
          render json: errors, status: :unprocessable_entity
        end
      end

      def destroy
        location = Location.find(params.require(:id))
        authorize(location, :destroy?)

        begin
          LocationService.destroy_location(location)
          head :ok
        rescue LocationService::DestroyError => error
          render json: { error: error.message }, status: :unprocessable_entity
        end
      end

      def children
        location = Location.find(params[:id])
        authorize(location, :show?)
        render json: location.children
      end

      def pick_location_for_container
        container_id = params.require(:container_id)
        container = Container.find(container_id)
        authorize(container, :authorized_in_lab?)
        location = LocationService.pick_location_for_container(container_id, !current_user)
        render json: { location: location }, status: :ok
      end

      def relocate
        location = Location.find(params.require(:id))
        authorize(location, :move?)
        parent = Location.find(params.require(:parent_id))

        if location.id == parent.id
          render json: { error: 'must choose different locations' }, status: :bad_request
          return
        end

        disallowed_categories = [ 'rack_cell', 'box_cell' ]

        if disallowed_categories.include?(location.location_type.category)
          render json: { error: 'bad source location type' }, status: :bad_request
          return
        end

        if disallowed_categories.include?(parent.location_type.category)
          render json: { error: 'bad dest location type' }, status: :bad_request
          return
        end

        location.parent_id = parent.id

        if location.save
          render json: { location: location }, status: :ok
        else
          render json: location.errors, status: :unprocessable_entity
        end
      end

      def search
        authorize(Location.new, :index?)
        scope = Pundit.policy_scope!(pundit_user, Location)
        permitted, error = LocationService.location_search_params(params.to_unsafe_h)

        if error
          return render json: { errors: [ error ] }, status: :unprocessable_entity
        end

        json_format   = params[:json_format]
        name          = permitted[:name]
        field_clauses = permitted.except :name, :properties
        prop_clauses  = permitted[:properties]
        locations     = scope.matching(name, field_clauses, prop_clauses).limit(20)

        json_spec = json_format == 'short' ? Location.short_json : Location.full_json

        render json: locations.as_json(json_spec)
      end
    end
  end
end
