class SupportTicket < ApplicationRecord
  has_snowflake_id('tkt')

  belongs_to :user
  belongs_to :run
end
