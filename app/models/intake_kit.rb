class IntakeKit < ApplicationRecord
  has_snowflake_id('ik')

  belongs_to :user
  belongs_to :organization
  belongs_to :address, -> { with_deleted }
  belongs_to :lab
  belongs_to :invoice_item
  has_many :containers
  has_many :intake_kit_items

  validates_presence_of :organization_id
  validates_presence_of :address_id

  accepts_nested_attributes_for :intake_kit_items, allow_destroy: true

  before_create lambda {
    self.status_message = status_message || 'Gathering shipping info'
    self.status = status || 'pending'
  }

  def self.short_json
    {
      only: [
        :id, :address_id, :organization_id, :lab_id, :easy_post_id, :plate_count,
        :box_count, :created_at, :received_at, :name, :status,
        :status_message, :status_update_time, :est_delivery_date, :carrier,
        :tracking_number, :admin_processed_at, :easy_post_label_url, :notes, :invoice_item_id
      ],
      methods: [],
      include: {
        intake_kit_items: IntakeKitItem.full_json
      }
    }
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def serializable_hash(opts = {})
    opts = IntakeKit.short_json.merge(opts || {})
    super(opts)
  end

  def process_by_admin
    if tracking_number.nil?
      errors.add(:tracking_number, "missing for #{id}")
      return false
    end

    if admin_processed_at.nil?
      update(admin_processed_at: DateTime.now, status: "delivered")
    else
      errors.add(:admin_processed_at, "already processed #{id}")
      false
    end
  end

  def sync_from_easypost
    shipment = EasyPost::Shipment.retrieve(easy_post_shipment_id)
    self.carrier = shipment.tracker.carrier
    self.est_delivery_date = shipment.tracker.est_delivery_date
    self.tracking_number = shipment.tracker.tracking_code

    lastest_tracking_info = shipment.tracker.tracking_details.last
    self.status = lastest_tracking_info.status
    self.status_message = lastest_tracking_info.message
    self.status_update_time = lastest_tracking_info.datetime

    self.received_at = status_update_time if status == 'delivered'
    save!
  end

  def charge(charge, payment_method_id)
    invoice_items = InvoiceManager.add_charge("Intake Kit #{Date.today} #{id}",
                              charge,
                              payment_method_id,
                              netsuite_item_id: InvoiceItem::NETSUITE_ACCOUNT_CLOUD_LAB_CHEMISTRY,
                              autocredit: true)
    invoice_item = invoice_items.find { |ii| ii.payment_method_id.present? && ii.credit_id.nil? }
    self.update(invoice_item: invoice_item)
  end

  def plate_count
    intake_kit_items.where(container_type_id: '96-pcr').map(&:quantity).sum
  end

  def box_count
    intake_kit_items.where(container_type_id: 'micro-1.5').map(&:quantity).sum
  end
end
