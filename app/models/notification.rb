class Notification < ApplicationRecord
  has_snowflake_id('n')
end
