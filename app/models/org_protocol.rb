class OrgProtocol < ApplicationRecord
    has_snowflake_id('orgpr')
    belongs_to :organization
    belongs_to :protocol
end
