module Api
  module V2
    class ProtocolsController < Api::ApiController
      def publish
        protocol = Protocol.find(params.require(:id))
        authorize(protocol, :publish_or_retract?)
        organization_ids = params.require(:organization_ids)

        owning_org_id = protocol.package.organization_id
        collaborating_org_ids = OrgCollaboration.where(src_org_id: owning_org_id).pluck(:dest_org_id)
        collaborating_org_ids.push(owning_org_id)
        if (organization_ids - collaborating_org_ids).present?
          return render json: { errors: "Not authorized" }, status: :forbidden
        end

        protocol.update!(published: true)
        OrgProtocol.where(organization: organization_ids, protocol: protocol).update_all(active: true)

        render json: protocol.as_json(Protocol.short_json)
      end

      def retract
        protocol = Protocol.find(params.require(:id))
        authorize(protocol, :publish_or_retract?)
        organization_ids = params.require(:organization_ids)

        owning_org_id = protocol.package.organization_id
        collaborating_org_ids = OrgCollaboration.where(src_org_id: owning_org_id).pluck(:dest_org_id)
        collaborating_org_ids.push(owning_org_id)

        if (organization_ids - collaborating_org_ids).present?
          return render json: { errors: "Not authorized" }, status: :forbidden
        end

        protocol.update!(published: false)
        OrgProtocol.where(organization: organization_ids, protocol: protocol).update_all(active: false)

        render json: protocol.as_json(Protocol.short_json)
      end
    end
  end
end
