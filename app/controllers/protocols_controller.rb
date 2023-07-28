class ProtocolsController < UserBaseController
  before_action :set_protocol, only: [ :update, :destroy ]

  def index
    # By default we want to return the full_json, but we special case
    # for the modal to load less.
    # TODO: We really need a generalized way for the client to request the data it needs.
    json_format = params[:browser_modal] ? Protocol.browser_modal_json : Protocol.full_json

    implementation_org = params[:filter]&.dig(:implementation_org)

    organization_filter = @organization
    if implementation_org.present? && has_feature_in_any_lab(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
      consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
      organization_filter = Organization.find(implementation_org) if consumer_org_ids.include?(implementation_org)
    end

    protocols = Protocol.visible_to(organization_filter).includes(:package)
    render json: protocols.as_json(json_format)
  end

  def show
    p = Protocol.find(params[:id])
    authorize(p, :show?)
    render json: p.as_json(Protocol.full_json)
  end

  def all_for_project
    project = Project.find(params.require(:project_id))

    authorize(project, :show?)
    protocols = Protocol.visible_to(@organization)
                        .includes(:package)
                        .joins(:runs)
                        .where(runs: { project_id: project.id })

    json_format = params[:browser_modal] ? Protocol.browser_modal_json : Protocol.full_json

    render json: protocols.as_json(json_format)
  end

  def all_for_release
    release = Release.find(params.require(:release_id))

    authorize(release, :show?)
    protocols = release.protocols

    render json: protocols.as_json(Protocol.short_json)
  end

  def all_protocols_for_package
    package = Package.find(params.require(:package_id))
    authorize(package, :show?)

    protocols =
      if params[:latest]
        # this only finds latest and published protocols
        Protocol.visible_to(package.organization)
      else
        Protocol
      end

    protocols = protocols.where(package_id: params.require(:package_id))

    if (name = params[:name])
      protocols = protocols.where(name: name)
    end

    render json: protocols.as_json(Protocol.short_json)
  end

  def retract
    protocol = Protocol.find(params.require(:id))
    authorize(protocol, :manage?)
    protocol.update!(published: false)
    render json: protocol.as_json(Protocol.full_json)
  end

  def publish
    protocol = Protocol.find(params.require(:id))
    authorize(protocol, :manage?)
    protocol.update!(published: true)
    render json: protocol.as_json(Protocol.full_json)
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_protocol
    @protocol = Protocol.find(params[:id])
    authorize(@protocol, :show?)
  end

  def protocol_params
    params.require(:protocol)
  end
end
