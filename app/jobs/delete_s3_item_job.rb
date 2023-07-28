class DeleteS3ItemJob
  include Sidekiq::Worker

  def perform(bucket, key)
    S3Helper.instance.client.delete_object({ bucket: bucket, key: key })
  end
end
