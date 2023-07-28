class Credit < ApplicationRecord
  audit_trail on: [ :create ], only: [ :name, :amount, :credit_type, :expires_at, :organization_id ]

  has_snowflake_id('cred')

  belongs_to :organization
  belongs_to :project # optional

  validates :organization, presence: true
  validates :credit_type, inclusion: { in: [ 'Runs', 'General' ] }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :name, presence: true
  validate :credit_should_not_be_expired

  before_validation(on: :create) do
    self.amount_remaining = self.amount
  end

  def credit_should_not_be_expired
    if expires_at.present? && expires_at < Time.now
      errors.add(:expires_at, :expired, value: expires_at)
    end
  end

  SPECIFICITY = {
    'Runs' => 10,
    'General' => 5
  }.freeze

  def more_specific_than(other_credit)
    SPECIFICITY[credit_type] > SPECIFICITY[other_credit.credit_type]
  end

  def applicable_to(invoice_item)
    return false if expires_at.present? and expires_at < (invoice_item.created_at || Time.now)

    case credit_type
    when 'General'
      true
    when 'Runs'
      invoice_item.run_credit_applicable
    else
      raise "unpossible"
    end
  end

  #
  # Immediately applies the amount remaining on the credit as an invoice
  # charge with a negative amount. This is a useful hack for applying
  # a credit immediately. Normally credits are applied at the end of the
  # month, during the billing cycle
  #
  def apply_remaining_balance!
    InvoiceItem.create!({
      name: "Credit #{name}",
      charge: -1 * amount_remaining,
      quantity: 1,
      organization_id: organization_id,
      credit_id: id
    })
  end
end
