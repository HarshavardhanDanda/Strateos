class Labeling < ApplicationRecord
  audit_trail
  belongs_to :label
  belongs_to :labelable, polymorphic: true

  validates_uniqueness_of :label_id, scope: :labelable_id
end
