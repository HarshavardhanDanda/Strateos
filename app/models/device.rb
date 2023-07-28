class Device < ApplicationRecord
  has_many :containers
  has_many :device_events, dependent: :destroy, autosave: true
  belongs_to :location
  belongs_to :work_unit

  validates :name, presence: true
  validates :id, uniqueness: true

  def self.full_json
    {
      only: [ :id, :name, :device_class, :configuration, :manufacturer, :model,
              :location_id, :purchased_at, :manufactured_at, :serial_number, :work_unit_id ],
      include: {
        device_events: {}
      },
      methods: []
    }
  end

  def self.short_json
    {
      only: [ :id, :name, :device_class, :configuration, :manufacturer, :model,
              :location_id, :purchased_at, :manufactured_at, :serial_number, :work_unit_id ],
      include: [],
      methods: []
    }
  end

  def lab
    self.work_unit.lab
  end

  scope :by_active_work_units, lambda { |is_active|
    where(work_unit_id: WorkUnit.where.not(inactive: is_active))
  }

end
