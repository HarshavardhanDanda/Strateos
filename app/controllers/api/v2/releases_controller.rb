module Api
  module V2
    class ReleasesController < Api::ApiController

      def publish
        release = Release.find(params.require(:id))
        organization_ids = params.require(:organization_ids)
        authorize(release, :manage?)

        if cannot_retract_or_publish?(release)
          return render json: { error: "Not authorized" }, status: :forbidden
        end

        release.protocols.each do |protocol|
          publish_protocol(protocol, organization_ids)
        end

        release.update_column(:published, true)

        render json: {
          release: release.as_json(Release.short_json),
          protocols: release.protocols.as_json(Protocol.short_json)
        }
      end

      def retract
        release = Release.find(params.require(:id))
        organization_ids = params.require(:organization_ids)

        authorize(release, :manage?)

        if cannot_retract_or_publish?(release)
          return render json: { error: "Not authorized" }, status: :forbidden
        end

        release.protocols.each do |p|
          retract_protocol(p, organization_ids)
        end

        release.update_column(:published, false)

        head :no_content
      end

      private

      def cannot_retract_or_publish?(release)
        collaborator_ids = collaborator_organizations(release)
        (params["organization_ids"] - collaborator_ids).present?
      end

      def retract_protocol(protocol, organization_ids)
        protocol.update!(published: false)
        OrgProtocol.where(organization_id: organization_ids, protocol: protocol).update_all(active: false)
      end

      def publish_protocol(protocol, organization_ids)
        protocol.update!(published: true)
        organization_ids.each do |org_id|
          org_protocol = OrgProtocol.find_or_create_by(protocol: protocol, organization_id: org_id)
          org_protocol.active = true
          org_protocol.save
        end
      end

      def collaborator_organizations(release)
        owning_org_id = release.protocols[0].package.organization_id
        collaborating_org_ids = OrgCollaboration.where(src_org_id: owning_org_id, topic: 'protocol').pluck(:dest_org_id)
        [ *collaborating_org_ids, owning_org_id ]
      end
    end
  end
end
