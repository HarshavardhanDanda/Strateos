class OrgCollaboration < ApplicationRecord
  has_snowflake_id('orgcl')
  belongs_to :src_org, :class_name => "Organization"
  belongs_to :dest_org, :class_name => "Organization"
end
