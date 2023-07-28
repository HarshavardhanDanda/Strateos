class S3UploadController < UserBaseController
  # TODO: remove and get users to use the upload api.
  def url_for
    key = params.require(:key)
    url = S3Helper.instance.url_for(S3_UPLOAD_BUCKET, key)
    redirect_to url
  end

  # TODO: remove and get users to use the upload api.
  def make_upload_uri
    name = params[:name]
    key  = AwsHelper.safe_key("uploads/#{SecureRandom.uuid}/#{name}")
    uri = S3Helper.instance.url_for(S3_UPLOAD_BUCKET, key, method: :put)
    render json: { uri: uri, key: key }
  end

end
