class LabConsumer < ApplicationRecord
    has_snowflake_id('lbc')

    belongs_to :organization
    belongs_to :lab
    validates_uniqueness_of :organization_id, :scope => [ :lab_id ]
end
