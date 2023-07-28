class QuickLaunch < ApplicationRecord
  has_snowflake_id('ql')

  belongs_to :project
  belongs_to :owner, class_name: "User"
end
