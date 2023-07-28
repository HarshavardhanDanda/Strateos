require 'aws-sigv4'

class DataObject < ApplicationRecord
  acts_as_paranoid

  audit_trail only: [ :name ]

  UNVERIFIED = 'unverified'
  VALID = 'valid'
  INVALID = 'invalid'
  STATUSES = [ UNVERIFIED, VALID, INVALID ]

  AUTOPICK_INFO_FORMAT = 'autopick_info'
  COUNT_CELLS_FORMAT = 'count_cells'
  CSV_FORMAT = 'csv'
  XML_FORMAT = 'xml'
  LCMRM_FORMAT = 'lcmrm'
  LCMS_DA_FORMAT = 'lcms_da'
  LCMS_FS_FORMAT = 'lcms_fs'
  LCMS_RM_FORMAT = 'lcms_rm'
  LCMS_SPE_FORMAT = 'lcms_spe'
  FILE_FORMAT = 'file'
  PDF_FORMAT = 'pdf'
  IMAGE_FORMAT = 'image'
  JSON_FORMAT = 'json'
  MEASURE_MASS_FORMAT = 'measure_mass'
  MEASURE_VOLUME_FORMAT = 'measure_volume'
  MEASURE_CONCENTRATION_FORMAT = 'measure_concentration'
  MESOSCALE_PLATEREADER_FORMAT = 'mesoscale_platereader'
  ENVISION_PLATEREADER_FORMAT = 'envision_platereader'
  SPECTROPHOTOMETRY_PLATEREADER_FORMAT = 'spectrophotometry_platereader'
  PLATEREADER_FORMAT = 'platereader'
  QPCR_FORMAT = 'qpcr'

  FORMATS = [
    AUTOPICK_INFO_FORMAT,
    COUNT_CELLS_FORMAT,
    CSV_FORMAT,
    XML_FORMAT,
    FILE_FORMAT,
    PDF_FORMAT,
    IMAGE_FORMAT,
    JSON_FORMAT,
    MEASURE_MASS_FORMAT,
    MEASURE_VOLUME_FORMAT,
    MEASURE_CONCENTRATION_FORMAT,
    MESOSCALE_PLATEREADER_FORMAT,
    ENVISION_PLATEREADER_FORMAT,
    SPECTROPHOTOMETRY_PLATEREADER_FORMAT,
    PLATEREADER_FORMAT,
    QPCR_FORMAT,
    LCMRM_FORMAT,
    LCMS_DA_FORMAT,
    LCMS_RM_FORMAT,
    LCMS_FS_FORMAT,
    LCMS_SPE_FORMAT
  ]

  LCMS_FORMAT_INFO = {
    content_type: "application/json",
    validator: DataObjectValidation::JSONValidator.new
  }

  FORMAT_INFO = {
    AUTOPICK_INFO_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::AutopickInfoValidator.new
    },
    COUNT_CELLS_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::CountCellsValidator.new
    },
    CSV_FORMAT => {
      content_type: "text/csv",
      validator: DataObjectValidation::CSVValidator.new
    },
    XML_FORMAT => {
      content_type: "text/xml",
      validator: DataObjectValidation::XMLValidator.new
    },
    ENVISION_PLATEREADER_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::EnvisionPlatereaderValidator.new
    },
    FILE_FORMAT => {
      content_type: "application/octet-stream",
      validator: DataObjectValidation::FileValidator.new
    },
    PDF_FORMAT => {
      content_type: "application/pdf",
      validator: DataObjectValidation::PdfValidator.new
    },
    IMAGE_FORMAT => {
      content_type: "image/jpeg",
      validator: DataObjectValidation::ImageValidator.new
    },
    JSON_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::JSONValidator.new
    },
    LCMRM_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::JSONValidator.new
    },
    LCMS_DA_FORMAT => LCMS_FORMAT_INFO,
    LCMS_FS_FORMAT => LCMS_FORMAT_INFO,
    LCMS_RM_FORMAT => LCMS_FORMAT_INFO,
    LCMS_SPE_FORMAT => LCMS_FORMAT_INFO,
    MEASURE_MASS_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::MeasureMassValidator.new
    },
    MEASURE_VOLUME_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::MeasureVolumeValidator.new
    },
    MEASURE_CONCENTRATION_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::MeasureConcentrationValidator.new
    },
    MESOSCALE_PLATEREADER_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::MesoscalePlatereaderValidator.new
    },
    PLATEREADER_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::PlateReaderValidator.new
    },
    QPCR_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::QPCRValidator.new
    },
    SPECTROPHOTOMETRY_PLATEREADER_FORMAT => {
      content_type: "application/json",
      validator: DataObjectValidation::SpectrophotometryPlatereaderValidator.new
    }
  }

  has_snowflake_id('do')
  belongs_to :dataset
  belongs_to :container, -> { with_deleted }
  belongs_to :aliquot

  validates :dataset, presence: true
  validates :size, presence: true
  validates :name, presence: true
  validates :s3_bucket, presence: true
  validates :s3_key, presence: true
  validates(:status, inclusion: { in: STATUSES, message: "%{value} is not a valid data object status (#{STATUSES})" })
  validates(:format, inclusion: { in: FORMATS, message: "%{value} is not a valid data object format (#{FORMATS})" })

  # Perform validation, might be expensive.
  def validate
    info = FORMAT_INFO[format]
    validator = info.try(:[], :validator)

    if validator.nil?
      msg = "DataObject cannot be validated, bad format: #{self.format}"
      Rails.logger.error(msg)

      errors = self.validation_errors || []
      errors << msg

      self.validation_errors = errors
      self.save!

      return
    end

    is_valid, errors = validator.validate(self)

    if is_valid
      self.status = DataObject::VALID
      self.validation_errors = []
    else
      self.status = DataObject::INVALID
      self.validation_errors = errors
    end

    self.save!
  end

  def guess_content_type
    info = FORMAT_INFO[format]
    default_type = info.try(:[], :content_type)

    if default_type.nil?
      return 'application/octet-stream'
    end

    extname = File.extname(name).downcase[1..]

    if format == IMAGE_FORMAT && [ 'jpg', 'jpeg', 'gif', 'png', 'bmp', 'tif', 'tiff' ].include?(extname)
      mtype = Mime::Type.lookup_by_extension(extname)

      if mtype
        return mtype.to_str
      end
    end

    if format == FILE_FORMAT
      mtype = Mime::Type.lookup_by_extension(extname)

      if mtype
        return mtype.to_str
      end
    end

    default_type
  end

  def s3_info
    { url: url, headers: {}}
  end

  def url
    filename = name || id
    # We set response_content_disposition like this to tell s3 to return a content-disposition
    # header that hints to the browser that we want the content downloaded as a file (attachment)
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#as_a_response_header_for_the_main_body
    response_content_disposition = "attachment;filename=\"#{filename}\""

    S3Helper.instance.url_for(s3_bucket,
                     s3_key,
                     expires_in: 60.minutes.to_i,
                     response_content_disposition: response_content_disposition)
  end

  # Get raw data from s3. Stubs out in test mode.
  # @return String The s3 data
  def s3_get_data
    if Rails.env.test?
      # for testing the key should be a path to the file
      return File.open(s3_key).read
    end

    S3Helper.instance.read(s3_bucket, s3_key)
  end

  def s3_exists?
    if Rails.env.test?
      return File.file?(s3_key)
    end

    begin
      S3Helper.instance.head_object(s3_bucket, s3_key)

      return true
    rescue Aws::S3::Errors::NotFound
      return false
    end
  end
end
