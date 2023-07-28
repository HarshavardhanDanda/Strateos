class CreditCard < PaymentMethod
  attr_accessor :stripe_one_time_id

  before_destroy lambda {
    return if Rails.env.development? || Rails.env.staging?

    fetch_stripe_card.try(:delete)
  }

  before_create lambda {
    begin
      card = organization.stripe_customer.sources.create(source: stripe_one_time_id)
    rescue Stripe::StripeError => e
      Rails.logger.info("Error creating creditcard: #{e}")
      errors[:base] << e.message

      throw(:abort)
    end

    if ![ 'credit', 'debit' ].include?(card.funding)
      # this must come before deletion as deletiong will remove attributes on the object.
      funding = card.funding

      card.delete

      errors[:base] << "CreditCard must be 'credit' or 'debit'.  '#{funding}' is not allowed"

      throw(:abort)
    end

    self.stripe_card_id     = card.id
    self.expiry             = Date.new(card.exp_year, card.exp_month).end_of_month
    self.credit_card_last_4 = card.last4
    self.credit_card_name   = card.name
    self.credit_card_type   = card.brand
  }

  def fetch_stripe_card
    organization.stripe_customer.sources.retrieve(stripe_card_id)
  end

  def charge!(invoice)
    return true unless invoice.total != 0

    Stripe::Charge.create(
      amount: (invoice.total * 100).round,
      currency: "usd",
      customer: organization.stripe_customer_id,
      source: stripe_card_id,
      description: "#{organization.name}: #{invoice.reference}"
    )
  end

  def charge(invoice)
    charge!(invoice)

    self.is_valid = true
    self.save
  rescue Stripe::CardError
    self.is_valid = false
    self.save

    raise PaymentDeclinedError
  end

  def validation_error
    next_billing_date = Date.today.next_month.beginning_of_month

    if !is_valid
      "Payment method is not valid."
    elsif expiry.nil? or expiry < next_billing_date
      "The next billing date is past this credit card's expiry date."
    else
      nil
    end
  end

  def description
    "#{credit_card_type} #{credit_card_last_4}"
  end

  def serializable_hash(opts = {})
    opts = {
      only: [ :id, :type, :stripe_card_id, :credit_card_last_4, :is_valid,
             :credit_card_type, :credit_card_name, :expiry, :created_at, :organization_id ],
      methods: [ :description, :is_removable, :is_default?, :can_make_default ]
    }.merge(opts || {})
    super(opts)
  end

  def policy_class
    PaymentMethodPolicy
  end
end
