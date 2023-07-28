class DeviceEvent < ApplicationRecord
  belongs_to :device
  validates :device, presence: true
  validates :date, presence: true
  validates :report_url, presence: true
  validates :event_type, inclusion: { in: [ 'qc', 'service' ], message: "'%{value}' is not a valid event type" }
end
