class ReleasesController < UserBaseController
  def index
    render json: Release.all.as_json(Release.full_json)
  end

  def show
    p = Release.find(params.require(:id))
    authorize(p, :show?)
    json_format = params[:short_json] ? Release.short_json : Release.full_json
    render json: p.as_json(json_format)
  end

  def all_for_package
    package = Package.find(params.require(:package_id))
    render json: package.releases.as_json(Release.short_json)
  end

  def publish
    r = Release.find(params.require(:id))
    authorize(r, :manage?)
    r.protocols.each do |p|
      p.update!(published: true)
    end
    render json: {
      release: r.as_json(Release.short_json),
      protocols: r.protocols.as_json(Protocol.short_json)
    }
  end

  def retract
    r = Release.find(params.require(:id))
    authorize(r, :manage?)
    r.protocols.each do |p|
      p.update!(published: false)
    end
    render json: {
      release: r.as_json(Release.short_json),
      protocols: r.protocols.as_json(Protocol.short_json)
    }
  end

  def create
    package = Package.find(params.require(:package_id))
    authorize(package, :update?)

    @release         = Release.new
    @release.package = package
    @release.user_id = params.require(:release).require('user_id')
    upload_id        = params.require(:release).require('upload_id')

    # get aws key from upload.
    upload = Upload.find(upload_id)
    authorize(upload, :show?)
    @release.bucket = S3_UPLOAD_BUCKET # hard coded for now
    @release.binary_attachment_url = upload.key

    authorize(@release, :manage?)

    if @release.save
      render json: @release, status: :created
    else
      render json: @release.errors, status: :unprocessable_entity
    end
  end

  def update
    @release = Release.where(package_id: params[:package_id], id: params[:id]).first!
    authorize(@release, :manage?)

    @release.published = params.require(:release).require('published')

    if @release.save
      render json: @release, status: 200
    else
      render json: @release.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @release = Release.where(package_id: params[:package_id], id: params[:id]).first!
    authorize(@release, :manage?)

    if @release.destroy
      render json: @release.as_json(Release.short_json)
    else
      render json: { errors: @release.errors }, status: :unprocessable_entity
    end
  end

  private

  def release_params
    params.require(:release)
  end
end
