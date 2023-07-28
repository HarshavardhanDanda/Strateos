class Shipment < ApplicationRecord
  has_snowflake_id('sr')
  acts_as_paranoid
  audit_trail only: [ :checked_in_at, :lab_id, :label ]

  belongs_to :organization
  belongs_to :user
  belongs_to :lab
  belongs_to :container_transfer
  has_many :containers
  has_many :implementation_shipment_items

  scope :pending_check_in, -> { where(checked_in_at: nil) }

  validates_presence_of :organization_id
  validates_inclusion_of :shipment_type, in: [ 'sample', 'implementation' ]

  before_create :add_shipping_label

  SHIPMENT_CODE_CHARS = ('A'..'Z').to_a

  def self.generate_uniq_shipment_codes(num)
    ::StringUtil.generate_uniq_random_strings(SHIPMENT_CODE_CHARS, 3, num)
  end

  SHORT_JSON = {
    only: [ :shipment_type, :created_at, :checked_in_at, :created_by, :id, :label, :editable,
           :data, :name, :organization_id, :packing_url, :user_id ],
    include: {
      organization: {
        only: [ :id, :name ],
        include: {},
        methods: []
      },
      user: {
        only: [ :id, :first_name, :last_name ],
        include: {},
        methods: [ :profile_img_url, :name ]
      }
    },
    methods: [ :status ]
  }.freeze

  INTERNAL_SHIPMENT_CHECKIN_JSON = {
    only: [ :shipment_type, :created_at, :checked_in_at, :created_by, :id, :label, :editable,
           :data, :name, :contact_name, :contact_number, :packing_url,
           :scheduled_pickup, :note, :receiving_note, :pickup_street, :pickup_zipcode, :organization_id ],
    include: {
      organization: {
        only: [ :id, :name, :test_account ],
        include: {},
        methods: []
      },
      containers: {
        only: [ :id, :label, :barcode, :container_type_id, :shipment_code,
               :storage_condition, :slot, :row, :status, :location_id, :cover ],
        include: {
          container_type: {
            only: [ :id, :name, :shortname, :acceptable_lids ],
            include: {},
            methods: []
          },
          location: {
            only: [ :id, :name ],
            include: {},
            methods: []
          }
        },
        methods: [ :suggested_user_barcode ]
      }
    },
    methods: [ :status ]
  }.freeze

  FULL_JSON = {
    only: [ :shipment_type, :created_at, :checked_in_at, :created_by, :id, :label, :editable,
           :data, :name, :contact_name, :contact_number, :packing_url,
           :scheduled_pickup, :note, :receiving_note, :pickup_street, :pickup_zipcode, :organization_id, :lab_id ],
    include: {
      organization: {
        only: [ :id, :name, :test_account ],
        include: {},
        methods: []
      },
      containers: {}
    },
    methods: [ :status ]
  }.freeze

  LIST_JSON = Shipment::FULL_JSON.merge({
    include: {
      organization: {
        only: [ :id, :name, :test_account ],
        include: {},
        methods: []
      },
      containers: {
        include: {}
      }
    }
  }).freeze

  def status
    if checked_in_at.nil?
      'pending'
    else
      'received'
    end
  end

  def checkedin_containers
    containers.where(status: "available")
  end

  def inbound_containers
    containers.where(status: "inbound")
  end

  def all_containers_checkedin?
    not inbound_containers.any?
  end

  def serializable_hash(opts = {})
    opts = SHORT_JSON.merge(opts || {})
    super(opts)
  end

  def checkin!(current_admin)
    self.checked_in_at = Time.now
    self.checked_in_by = current_admin.id
    self.editable = false

    self.save!

    if self.shipment_type == 'implementation'
      ImplementationShipmentSlackMessage.perform_async(self.id)
    elsif self.shipment_type == 'sample'
      NOTIFICATION_SERVICE.shipment_checked_in(self)
    end
  end

  private

  def add_shipping_label
    l = nil
    loop do
      l = make_shipping_label
      break if Shipment.where(label: l, checked_in_at: nil).empty?
    end
    self.label = l
  end

  ShippingLabelChars = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(//)
  def make_shipping_label
    ShippingLabelChars.sample(4).join
  end
end
