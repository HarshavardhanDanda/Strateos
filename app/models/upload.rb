class Upload < ApplicationRecord
  has_snowflake_id 'up'

  audit_trail only: [ :file_name, :state ]

  STATE_NEW         = "new"
  STATE_IN_PROGRESS = "in-progress"
  STATE_COMPLETE    = "complete"

  STATE_OFFLINE          = "offline"
  STATE_OFFLINE_COMPLETE = "offline-complete"
  STATE_OFFLINE_ERROR    = "offline-error"
  STATE_OFFLINE_BAD_FILE_NAME = "offline-bad-file-name-format"
  STATE_OFFLINE_PARSE_ERROR = "offline-parse-error"
  STATE_OFFLINE_INVALID_BARCODE = "offline-invalid-barcode"
  STATE_OFFLINE_INVALID_CONTAINER_TYPE = "offline-invalid-container-type"
  STATE_OFFLINE_INVALID_DATA_OBJECT = "offline-invalid-data-object"
  STATE_OFFLINE_NO_ORG  = "offline-no-org"
  STATE_OFFLINE_NO_RUN  = "offline-no-run"
  STATE_OFFLINE_NO_INSTRUCTION = "offline-no-instruction"
  STATE_OFFLINE_NO_CONTAINER = "offline-no-container"
  STATE_OFFLINE_NO_ALIQUOT = "offline-no-aliquot"
  STATE_OFFLINE_NO_COMPOUND_LINK = "offline-no-compound-link"
  STATE_OFFLINE_ALREADY_DATASET = "offline-already-dataset"

  scope :incomplete, -> { where.not(state: STATE_COMPLETE) }

  has_many :upload_parts, dependent: :destroy
  belongs_to :user, polymorphic: true # Damn those separate admin models

  validates_presence_of :user

  def self.upsert_by_s3_object(bucket, key, size)
    upload = Upload.find_or_initialize_by(bucket: bucket, key: key)
    upload.state ||= Upload::STATE_OFFLINE
    upload.last_modified ||= Time.now
    upload.is_multipart ||= false
    upload.file_size ||= size
    upload.file_name ||= File.basename(key)
    # NOTE: We don't have a user/admin context
    upload.user = Admin.new(id: 'unknow')

    unless upload.save
      Rails.logger.info("[Upload]: Error saving upload with id: #{upload.id}")
      Rails.logger.info("[Upload]: Error: #{upload.errors.inspect}")
      return
    end

    return upload
  end

  def url
    # generates a temporary downlaod URL
    # We set response_content_disposition like this to tell s3 to return a content-disposition
    # header that hints to the browser that we want the content downloaded as a file (attachment)
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#as_a_response_header_for_the_main_body
    S3Helper.instance.url_for(bucket,
                     key,
                     expires_in:  60.minutes.to_i,
                     response_content_disposition: "attachment;filename=\"#{self.file_name}\"")
  end

  def upload_url
    # only allow one shot upload for non multipart
    return nil if is_multipart

    # We want to discourage uploading over old data, so limit one shot url
    return nil if created_at && created_at < (Time.now - 1.hour)

    # generates a temporary upload URL
    S3Helper.instance.url_for(bucket,
                     key,
                     expires_in: 60.minutes.to_i,
                     method: :put)
  end

  def upload_parts_from_s3
    return {} if !is_multipart

    results   = {}
    S3Helper.instance.client.list_parts({ bucket: bucket, key: key, upload_id: aws_upload_id }).parts.each do |part|
      # This is silly, but s3 returns quotes inside the quoted string
      results[part.part_number] = { md5: part.etag[1...-1], size: part.size }
    end

    results
  end

  def s3_exists?
    if Rails.env.test?
      return true
    end

    S3Helper.instance.object(bucket, key).exists?
  end

  def s3_metadata
    if Rails.env.test?
      return {
        content_type: "fake/fake",
        size: 0
      }
    end

    S3Helper.instance.metadata(bucket, key)
  end
end
