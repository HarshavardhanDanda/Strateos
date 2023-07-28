module InvoiceManager
  module_function

  # Check to see if all invoice items and the payment method is valid.
  # TODO: Add DB optimistic locking, or pessimistic, to handle concurrent item creation.
  def can_add_charges(invoice_items)
    payment_method_ids = invoice_items.map(&:payment_method_id).uniq
    if payment_method_ids.size != 1
      raise PaymentRequiredException
    end

    payment_method_id = payment_method_ids[0]
    if payment_method_id.nil?
      raise PaymentRequiredException
    end

    payment_method = PaymentMethod.find_by(id: payment_method_id)
    if payment_method.nil?
      raise PaymentRequiredException.new('Payment method provided does not exist')
    end

    if payment_method.validation_error
      raise PaymentRequiredException.new(payment_method.validation_error)
    end

    total = invoice_items.sum(&:total)
    if total > payment_method.limit
      # make sure we don't overcharge a payment_method.
      raise PaymentRequiredException.new("Charge of #{total} is greater than payment method's limit")
    end
  end

  # Create an invoice item that represents a charge and optionally apply credits.
  def add_charge(name, charge, payment_method_id,
                 quantity: 1, description: nil,
                 netsuite_item_id: InvoiceItem::NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY,
                 run_id: nil, project_id: nil, invoice_id: nil,
                 run_credit_applicable: false, autocredit: false, credit_id: nil, delay_invoice: false)

    if autocredit && !credit_id.nil?
      raise(ArgumentError, "You cannot specify autocredit: true and also specify a credit.")
    end

    pm      = PaymentMethod.find(payment_method_id)
    org     = pm.organization
    run     = run_id.nil? ? nil : Run.find(run_id)

    invoice =
      if invoice_id.nil?
        # Create an invoice if this is the first charge of the month.
        Invoice.get_or_create!(pm) if !delay_invoice
      else
        Invoice.find(invoice_id)
      end

    # Create invoice item for payment method.
    invoice_item = InvoiceItem.new(
      name: name,
      charge: charge,
      quantity: quantity,
      xero_account_code: InvoiceItem::XERO_ACCOUNT_MOLECULAR_BIOLOGY,
      netsuite_item_id: netsuite_item_id,
      description: (description || name),
      run_credit_applicable: run_credit_applicable,
      invoice_id: invoice&.id,
      organization_id: org.id,
      payment_method_id: pm.id,
      run_id: run.try(:id),
      credit_id: credit_id
    )

    # auto create credits.
    credit_items =
      if autocredit
        auto_apply_credits(invoice_item)
      else
        []
      end

    all_items = credit_items + [ invoice_item ]
    can_add_charges(all_items)

    InvoiceItem.transaction do
      all_items.each(&:save!)
    end

    all_items
  end

  # Apply credits by generating negative invoice items to cover the charge from the given invoice_item
  # NOTE: We do not save the created invoice_items.
  def apply_credits(invoice_item, credits)
    charge_remaining = invoice_item.total

    # we are converting expiry dates into strings(keys) and sort the credits based on keys.
    # NOTE: If expiry date is nil, the key for those credits is taken as "9". those credits are placed last when sorted.
    # Then, we are sorting credits by credit type, if type is Runs key is 0, else key is 1. So, Runs are placed first.
    sorted_credits = credits.sort_by do |credit|
      [ credit.expires_at ? credit.expires_at.to_s : "9",
        credit.credit_type == "Runs" ? 0 : 1 ]
    end

    # Create invoice_items that have a negative charge
    credit_items = sorted_credits.map { |credit|
      next nil if charge_remaining <= 0

      credit_charge     = [ credit.amount_remaining, charge_remaining ].min
      charge_remaining -= credit_charge

      InvoiceItem.new(
        name: "ApplyCredit(#{credit.id}): #{invoice_item.name}",
        charge: -credit_charge,
        quantity: 1,
        xero_account_code: invoice_item.xero_account_code,
        invoice_id: invoice_item.invoice_id,
        payment_method_id: invoice_item.payment_method_id,
        credit_id: credit.id,
        organization_id: invoice_item.organization_id,
        run_id: invoice_item.run_id,
        netsuite_item_id: invoice_item.netsuite_item_id
      )
    }.compact

    credit_items
  end

  def auto_apply_credits(invoice_item)
    all_credits    = Credit.where(organization_id: invoice_item.organization_id).where("amount_remaining > 0")
    usable_credits = all_credits.select { |c| c.applicable_to(invoice_item) }

    return apply_credits(invoice_item, usable_credits)
  end
end
