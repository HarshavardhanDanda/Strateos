module Api
  module V1
    class ShipmentsController < Api::ApiController
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
              organization_id: { type: "string" },
              shipment_type: { type: "string" },
              name: { type: "string" },
              note: { type: "string" },
              packing_url: { type: "string" },
              lab_id: { type: "string" }
            },
            required: [
              "organization_id",
              "shipment_type",
              "name",
              "note",
              "lab_id"
            ]
          },
          container_ids: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "attributes"
        ]
      }

      CREATE_IMPLEMENTATION_ITEM_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          type: { type: "string" },
          attributes: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "string" },
              container_type: { type: "string" },
              storage_condition: { type: "string" },
              note: { type: "string" },
              checked_in_at: { type: "string" },
              location: { type: "string" },
              shipment_id: { type: "string" }
            },
            required: [
              "name",
              "quantity",
              "container_type",
              "shipment_id"
            ]
          }
        },
        required: [
          "attributes"
        ]
      }

      SHIPMENTS_DESTROY_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          attributes: {
            type: "object",
            properties: {
              shipment_ids: {
                type: "array",
                items: [
                  {
                    "type": "string"
                  }
                ]
              }
            },
            required: [
              "shipment_ids"
            ]
          }
        },
        required: [
          "attributes"
        ]
      }

      CHECKIN_CONTAINERS_SCHEMA = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        attributes: {
          type: "object",
          properties: {
            container_ids: {
              type: "array",
              items: [
                {
                  "type": "string"
                }
              ]
            }
          },
          required: [
            "container_ids"
          ]
        }
      },
      required: [
        "attributes"
      ]
    }



      def partial_checkin
        id = params.require(:id)
        scope = Pundit.policy_scope!(pundit_user, Shipment)
        shipment = scope.find(id)
        authorize(shipment, :partial_checkin?)
        shipment.checked_in_by = current_user.id

        if !shipment.save
          return render json: shipment.errors, status: :unprocessable_entity
        end

        if shipment.shipment_type == 'implementation'
          ImplementationShipmentSlackMessage.perform_async(id)
        end
        render json: serialize_shipment(shipment)
      end

      def checkin
        id = params.require(:id)
        scope = Pundit.policy_scope!(pundit_user, Shipment)

        shipment = scope.find(id)
        authorize(shipment, :checkin?)
        shipment.checkin!(current_user)
        render json: serialize_shipment(shipment)
      rescue
        return render json: shipment.errors, status: :unprocessable_entity
      end

      def checkin_containers
        validate_json(CHECKIN_CONTAINERS_SCHEMA, params[:data].to_unsafe_hash)
        scope = Pundit.policy_scope!(pundit_user, Shipment)
        shipment = scope.find(params.require(:id))
        shipment.editable = false
        authorize(shipment, :checkin_containers?)

        container_ids = params[:data][:attributes][:container_ids]

        ActiveRecord::Base.transaction do
          shipment.save!
          container_ids.each do |container_id|
            container = shipment.containers.find(container_id)
            container.update_container_and_destroy_consumable
            container.checkin(current_user)
          end
        end

        render json: serialize_shipment(shipment)
      end

      def destroy_many
        validate_json(SHIPMENTS_DESTROY_SCHEMA, params[:data].to_unsafe_hash)
        shipments = Shipment.find(params[:data][:attributes][:shipment_ids])

        ActiveRecord::Base.transaction do
          shipments.each do |shipment|
            authorize(shipment, :destroy?)
            shipment.inbound_containers.each do |container|
              authorize(container, :shipment_container_destroy?)
              requester = current_user
              if (error = container.request_destroy(requester))
                raise ContainersNotDestroyable, error
              end
            end
            shipment.delete
          end
        end
        head :ok
      rescue ContainersNotDestroyable => e
        render json: { error: e.message }, status: :bad_request
      end

      def create
        ActiveRecord::Base.transaction do
          shipment = create_shipment(params)
          container_ids = params[:data][:container_ids] || []
          Container.bulk_link_shipment(container_ids, shipment.id)
          render json: serialize_shipment(shipment), status: :created
        end
      end

      def create_shipment_with_codes
        ActiveRecord::Base.transaction do
          shipment = create_shipment(params)
          container_ids = params[:data][:container_ids] || []
          Container.bulk_link_shipment_and_codes(container_ids, shipment.id)
          render json: serialize_shipment(shipment), status: :created
        end
      end

      def create_implementation_items_shipment
        ActiveRecord::Base.transaction do
          shipment = create_shipment(params[:data])
          implementation_item_params = params[:data][:implementation_item_params]
          create_implementation_item(implementation_item_params, shipment)
          render json: serialize_shipment(shipment), status: :created
        end
      end

      private

      def create_shipment(params)
        data = params[:data].to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)
        shipment_params = data[:attributes]

        shipment = Shipment.new(shipment_params)
        shipment.created_by = current_user.id
        shipment.user_id = current_user.id

        authorize(shipment, :create?)
        if shipment.save
          return shipment
        else
          render json: shipment.errors, status: :unprocessable_entity
        end
      end

      def create_implementation_item(params, shipment)
        params.map do |implementation_param|
          data = implementation_param[:data].to_unsafe_hash
          data[:attributes][:shipment_id] = shipment.id
          validate_json(CREATE_IMPLEMENTATION_ITEM_SCHEMA, data)

          implementation_item_params = data[:attributes]
          implementation_item = ImplementationItem.new(implementation_item_params)

          authorize(implementation_item, :create?)
          if implementation_item.save
          else
            render json: implementation_item.errors, status: :unprocessable_entity
          end
        end if params
      end

      def serialize_shipment(shipment)
        resource = Api::V1::ShipmentResource.new(shipment, context)
        serializer = Api::V1::ShipmentResource.serializer
        serializer.serialize_to_hash(resource)
      end
    end
  end
end
