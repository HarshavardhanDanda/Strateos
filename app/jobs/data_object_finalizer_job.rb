# DataObject post creation:
#    - Validates a DataObject
#    - Updates DataObject and its Dataset status.
#    - Copies to permanent S3 location.
class DataObjectFinalizerJob
  include Sidekiq::Worker

  # Copies the s3_object to the canonical path in s3
  #
  #   S3_DATASET_BUCKET/DATASET_ID/DATA_OBJECT_ID/FILENAME
  def copy_to_s3(data_object)
    dst_base_key = "#{data_object.dataset_id}/#{data_object.id}"
    dst_name     = data_object.name || data_object.id

    # update content_type
    ctype = data_object.content_type
    if ctype.nil? || ctype.blank?
      ctype = data_object.guess_content_type
    end
    data_object.content_type = ctype

    new_bucket, new_key = S3Helper.instance.safe_copy(data_object.s3_bucket,
                                             data_object.s3_key,
                                             S3_DATASET_BUCKET,
                                             dst_base_key,
                                             dst_name,
                                             options: { content_type: ctype })

    data_object.name      = dst_name
    data_object.s3_bucket = new_bucket
    data_object.s3_key    = new_key
    data_object.save!
  end

  def perform(id)
    if Rails.env.test?
      return
    end

    data_object = DataObject.find(id)

    data_object.validate
    copy_to_s3(data_object)

    data_object.save!
    Rails.logger.info("Completed DataObjectFinalizerJob for #{id}")
  end
end
