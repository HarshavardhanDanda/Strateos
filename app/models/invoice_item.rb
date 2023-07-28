class InvoiceItem < ApplicationRecord
  has_snowflake_id('chrg')

  # Xero account codes
  XERO_ACCOUNT_MOLECULAR_BIOLOGY        = 41_020
  XERO_ACCOUNT_RUN_IMPLEMENTATION       = 41_050
  XERO_ACCOUNT_RUN_REAGENTS             = 41_075
  XERO_ACCOUNT_RUN_EXECUTION            = 41_125
  XERO_ACCOUNT_SHIPPING                 = 41_100

  NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY    = 15
  NETSUITE_ACCOUNT_CLOUD_LAB_CHEMISTRY  = 16
  NETSUITE_ACCOUNT_SHIPPING_REVENUE     = 17
  NETSUITE_ACCOUNT_LAB_OS_IMPLEMENTATION= 18
  NETSUITE_ACCOUNT_LAB_OS_SUBSCRIPTION  = 19
  NETSUITE_ACCOUNT_EXECUTION_SD2        = 20
  NETSUITE_ACCOUNT_IMPLEMENTATION_SD2   = 21
  NETSUITE_ACCOUNT_TISSUE_IMAGING       = 42


  NETSUITE_ACCOUNT_CODES = [
    NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY,
    NETSUITE_ACCOUNT_CLOUD_LAB_CHEMISTRY,
    NETSUITE_ACCOUNT_SHIPPING_REVENUE,
    NETSUITE_ACCOUNT_LAB_OS_IMPLEMENTATION,
    NETSUITE_ACCOUNT_LAB_OS_SUBSCRIPTION,
    NETSUITE_ACCOUNT_EXECUTION_SD2,
    NETSUITE_ACCOUNT_IMPLEMENTATION_SD2,
    NETSUITE_ACCOUNT_TISSUE_IMAGING
  ]


  belongs_to :invoice         # initially nil, transitions upon billing
  belongs_to :organization
  belongs_to :run             # optional
  has_one :project, through: :run
  belongs_to :credit          # optional
  belongs_to :payment_method  # optional

  validates_associated :organization
  validates :organization, presence: true
  validates_presence_of :name, :charge, :quantity
  validates :charge, numericality: true
  validate :validate_netsuite_item_id
  validate :validate_if_invoice_id_is_already_charged

  def validate_netsuite_item_id
    if self.netsuite_item_id.present? && !NETSUITE_ACCOUNT_CODES.include?(self.netsuite_item_id.to_i)
      errors.add(:netsuite_item_id, :invalid_id, value: self.netsuite_item_id)
    end
  end

  def validate_if_invoice_id_is_already_charged
    if self.invoice_id.present?
      invoice = Invoice.find(self.invoice_id)
      if !invoice.netsuite_invoice_id.blank?
        errors.add(:invoice_id, :already_charged, value: invoice_id)
      end
    end
  end

  validate lambda {
    if organization.test_account
      errors.add :base, "cannot charge test accounts"
    end
  }, on: :create

  # default netsuite_item_id
  before_save lambda {
    self.xero_account_code ||= XERO_ACCOUNT_MOLECULAR_BIOLOGY # remove after netsuite migration
    self.netsuite_item_id ||= NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY
  }

  # all invoice items that have not yet been sent to Xero
  scope :outstanding, lambda {
    joins(:invoice).where(invoices: { xero_invoice_guid: nil })
  }

  # all invoice items that have not yet been sent to Xero
  scope :finalized, lambda {
    joins(:invoice).where.not(invoices: { xero_invoice_guid: nil })
  }

  after_create lambda {
    if credit.present?
      credit.amount_remaining += self.total # charge is negative
      credit.save
    end
  }

  before_destroy lambda {
    # don't delete invoice items that have been sent to xero.
    if invoice_id.present? && invoice.xero_invoice_guid.present?
      self.run.errors.add(:base, "can no longer delete invoice items.")
      throw(:abort)
    end
  }

  after_destroy lambda {
    if credit.present?
      credit.amount_remaining -= self.total # charge is negative
      credit.save
    end
  }

  def total
    charge * quantity
  end

  def project_id
    if run.present?
      return run.project_id
    end
  end

  def project_name
    return project&.name
  end

  def link_invoice
    payment_method = PaymentMethod.find(self.payment_method_id)
    invoice = Invoice.get_or_create!(payment_method)

    self.update(invoice_id: invoice.id)
  end

  def self.short_json
    {
      only: [ :id, :name, :description, :charge, :quantity, :created_at ],
      methods: [ :total, :project_id, :project_name ],
      include: {}
    }
  end

  def serializable_hash(opts = {})
    opts = InvoiceItem.short_json.merge(opts || {})
    super(opts)
  end
end
