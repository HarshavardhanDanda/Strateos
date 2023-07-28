class PurchaseOrder < PaymentMethod
  audit_trail on: [ :create, :update ], only: [ :po_reference_number, :address_id, :expiry, :organization_id,
    :po_approved_at ]

  belongs_to :address

  validates :po_reference_number, presence: true
  validates :po_limit, presence: true, numericality: { greater_than_or_equal_to: 1 }
  validates :po_attachment_url, presence: true
  validates :address_id, presence: true
  validate lambda {
    if expired?
      errors.add(:expiry, "has expired")
    end
  }

  def charge(_invoice)
    # not yet remitted
    false
  end

  def approve
    self.po_approved_at = Time.now
    self.save
  end

  def description
    self.alias || "PO #{po_reference_number}"
  end

  def validation_error
    if po_approved_at.nil?
      "Purchase order has not been approved."
    else
      return super
    end
  end

  def limit
    po_limit - total
  end

  def serializable_hash(opts = {})
    opts = {
      only: [ :id, :type, :po_reference_number, :po_limit, :po_attachment_url, :is_valid,
             :po_approved_at, :expiry, :created_at, :po_invoice_address, :organization_id ],
      methods: [ :description, :is_removable, :is_default?, :can_make_default, :limit, :expired? ],
      include: [ :address ]
    }.merge(opts || {})
    super(opts)
  end

  def policy_class
    PaymentMethodPolicy
  end
end
