class RunStatusAudit < ApplicationRecord
  has_snowflake_id('rsa')

  belongs_to :run
  belongs_to :user

  validates :run_id, presence: true
  validates :status, presence: true
end
