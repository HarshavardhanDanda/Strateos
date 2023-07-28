class UploadPart < ApplicationRecord
  has_snowflake_id 'upp'

  belongs_to :upload
end
