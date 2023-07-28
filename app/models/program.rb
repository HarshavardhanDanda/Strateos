class Program < ApplicationRecord
  has_snowflake_id('prg')

  belongs_to :user
  belongs_to :organization

  def url
    S3Helper.instance.url_for(s3_bucket, s3_key, expires_in: 60.minutes.to_i)
  end

  def can_be_seen_by?(user)
    user.id == self.user_id
  end
end
