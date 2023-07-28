module Api
  module V1
    class IntakeKitsController < Api::ApiController

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
              name: {
                type: "string"
              },
              address_id: {
                type: "string"
              },
              lab_id: {
                type: "string"
              },
              charge: {
                type: "string"
              },
              payment_method_id: {
                type: "string"
              },
              intake_kit_items_attributes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    container_type_id: { type: "string" },
                    quantity: { type: "number, string" }
                  },
                  required: [
                    "container_type_id",
                    "quantity"
                  ]
                }
              }
            },
            required: [
              "name",
              "address_id",
              "lab_id",
              "payment_method_id"
            ]
          }
        },
        required: [
          "attributes"
        ]
      }

      def create
        data = params.require(:data).to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)

        authorize(IntakeKit.new(organization: @organization), :create?)

        ik_params   = data[:attributes]
        name        = ik_params[:name]
        charge      = ik_params[:charge].to_f
        address     = Address.find ik_params[:address_id]
        lab_id      = ik_params[:lab_id]
        intake_kit_items = ik_params[:intake_kit_items_attributes]
        payment_method_id = ik_params[:payment_method_id]
        authorize(address, :show?)

        if @organization.payment_methods.count < 1
          return render json: { code: 'no_payment_method' }, status: :payment_required
        end

        ik_attributes = {
          user: current_user,
          organization: @organization,
          name: name,
          address_id: address.id,
          lab_id: lab_id || @organization.labs.first,
          intake_kit_items_attributes: intake_kit_items || []
        }

        intake_kit = IntakeKit.new(ik_attributes)

        if intake_kit.save
          intake_kit.charge(charge, payment_method_id)
          EasyPostIntakeKitBackgroundJob.perform_async(intake_kit.id)
          SlackMessageForIntakeKitJob.perform_async(intake_kit.id)
          render json: serialize_intake_kit(intake_kit), status: :created
        else
          render json: intake_kit.errors, status: :unprocessable_entity
        end
      end

      def update
        intake_kit = IntakeKit.find(params.require(:id));
        authorize(intake_kit, :update?)

        intake_kit_params = params.permit(:intake_kit => {}).dig(:intake_kit)
        admin_processed_at = params.permit(:admin_processed_at)

        if intake_kit_params.present? & intake_kit_params.except(:admin_processed_at).present?
          intake_kit.update(intake_kit_params.except(:admin_processed_at))
        end

        if admin_processed_at.present?
          processed = intake_kit.process_by_admin
          NOTIFICATION_SERVICE.intake_kit_shipped(intake_kit) if processed
        end

        if intake_kit.errors.empty?
          render json: intake_kit
        else
          render json: intake_kit.errors, status: :unprocessable_entity
        end
      end

      def serialize_intake_kit(intake_kit)
        resource = Api::V1::IntakeKitResource.new(intake_kit, context)
        serializer = Api::V1::IntakeKitResource.serializer
        serializer.serialize_to_hash(resource)
      end

      def show
        scope = Pundit.policy_scope!(pundit_user, IntakeKit)

        intake_kit_id = params.require(:id)
        intake_kit = scope.find(intake_kit_id)
        if !intake_kit.nil?
          render json: intake_kit, status: :ok
        else
          render json: intake_kit.errors, status: :unprocessable_entity
        end
      end
    end
  end
end
