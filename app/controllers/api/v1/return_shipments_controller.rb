module Api
  module V1
    class ReturnShipmentsController < Api::ApiController

      def pending
        authorize(ReturnShipment, :pending?)
        labs = lab_ids_by_feature(MANAGE_SAMPLE_RETURN_SHIPMENTS)
        scope = Pundit.policy_scope!(pundit_user, ReturnShipment)
        shipments = scope.where({ status: [ "authorized", "purchased" ], lab_id: labs })
        render json: ReturnShipment.to_admin_json(shipments)
      end

      def purchase
        rs = ReturnShipment.find params.require('id')
        authorize(rs, :purchase?)
        rs.purchase()

        render json: ReturnShipment.to_admin_json(rs)
      rescue ReturnShipmentError => e
        render json: { error_message: e.message }, status: :bad_request
      end

      def ship
        rs = ReturnShipment.find params.require('id')
        authorize(rs, :ship?)
        rs.ship()

        render json: ReturnShipment.to_admin_json(rs)
      end

      def cancel
        rs = ReturnShipment.find params.require('id')
        authorize(rs, :cancel?)
        rs.cancel()

        render json: { success: true }
      end
    end
  end
end
