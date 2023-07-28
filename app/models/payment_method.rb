class PaymentDeclinedError < StandardError
end

class PaymentMethod < ApplicationRecord
  has_snowflake_id('pm')
  acts_as_paranoid

  belongs_to :organization
  has_many :projects, dependent: :nullify
  has_many :invoice_items
  has_many :invoices

  # nil out the `default_payment_method_id` field on the associated
  # Organization when this record is removed.
  has_one :org_for_which_i_am_default,
          class_name: 'Organization',
          dependent: :nullify,
          foreign_key: 'default_payment_method_id'

  validates :type, inclusion: { in: [ 'CreditCard', 'PurchaseOrder' ] }
  validates_associated :organization
  validate :approvable, on: :update, if: :will_save_change_to_po_approved_at?

  before_destroy lambda {
    unless is_removable
      errors.add(:base, "Can't be removed. Please make sure this is not the default payment and " \
                        "that there are no outstanding invoice items using this payment method.")
      throw(:abort)
    end
  }

  before_save :on_po_approved_at, if: :will_save_change_to_po_approved_at?

  def on_po_approved_at
    if Current.user
      organization = self.organization
      org_has_no_valid_pms = organization&.valid_payment_methods&.count == 0
      if org_has_no_valid_pms
        organization.default_payment_method = self
        organization.save!
      end
    end
  end

  def approvable
    if Current.user
      if self.is_valid == false
        errors.add(:is_valid, :is_false)
      end
    end
  end

  def billing_address
    # Only purchase orders have a known billing address
    # which is, sadly, stored as a string
    nil
  end

  def expired?
    expiry.present? && expiry < Date.today
  end

  def can_make_default
    not validation_error
  end

  def is_default?
    organization.default_payment_method == self
  end

  def is_removable
    outstanding_invoice_items.count == 0
  end

  def validation_error
    if not is_valid
      return "Payment method is not valid."
    elsif expired?
      return "Payment method has expired."
    else
      return nil
    end
  end

  def self.all_valid
    next_billing_day = "date(date_trunc('month', date(now() + interval '1 month')))"

    self.where("expiry is null or expiry >= #{next_billing_day}")
        .where("type != 'PurchaseOrder' OR po_approved_at IS NOT NULL")
  end

  def outstanding_invoice_items
    invoice_items.joins(:invoice).where(invoices: { xero_invoice_guid: nil })
  end

  def total_outstanding
    outstanding_invoice_items.sum('charge * quantity')
  end

  def total
    invoice_items.sum('charge * quantity')
  end

  def limit
    BigDecimal::INFINITY
  end
end
