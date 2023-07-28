class QuickLaunchesController < UserBaseController
  before_action :find_project_context, only: [ :show, :resolve_inputs ]

  def create
    manifest        = params.require(:manifest)
    manifest_inputs = manifest.require(:inputs)

    errors = ManifestUtil.validate_manifest_inputs(manifest_inputs.to_unsafe_h)
    if not errors.empty?
      return render json: { errors: errors }, status: :bad_request
    end

    quick_launch = QuickLaunch.new(owner: current_user,
                                   manifest: manifest.to_unsafe_h,
                                   project: Project.find(params[:project_id]))

    authorize(quick_launch, :create?)

    if quick_launch.save
      render json: quick_launch, status: :created
    else
      render json: quick_launch.errors, status: :bad_request
    end
  end

  def show
    quick_launch = QuickLaunch.find(params.require(:id))
    authorize(quick_launch, :show?)

    render json: quick_launch
  end

  def resolve_inputs
    quick_launch = QuickLaunch.find(params.require(:id))
    authorize(quick_launch, :show?)

    raw_inputs = params.require(:inputs).to_unsafe_h
    types      = quick_launch.manifest["inputs"]

    errors = ManifestUtil.validate_inputs(raw_inputs, types)
    if not errors.empty?
      return render json: { errors: errors }, status: :bad_request
    end

    organization = quick_launch.project.organization

    inputs = LaunchRequest.inputs_for_parameters(organization, types, raw_inputs)
    quick_launch.update!(raw_inputs: raw_inputs, inputs: inputs)

    render json: quick_launch
  end

end
