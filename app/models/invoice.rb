class Invoice < ApplicationRecord
  has_snowflake_id('inv')
  audit_trail on: [ :update ], only: [ :charged_at ]

  belongs_to :organization
  belongs_to :payment_method, -> { with_deleted }
  has_many :invoice_items, dependent: :destroy
  has_many :billing_contacts, through: :organization
  validates :organization, presence: true
  validates :payment_method, presence: true
  validates :month, presence: true
  validates :reference, presence: true
  validate :remittable, on: :update, if: :will_save_change_to_remitted_at?
  validate :forgivable, on: :update, if: :will_save_change_to_forgiven_at?
  validate :chargeable, on: :update, if: :will_save_change_to_charged_at?

  before_update :on_forgive, if: :will_save_change_to_forgiven_at?
  before_update :on_charge, if: :will_save_change_to_charged_at?


  def on_forgive
    if Current.user
      if Feature.enabled?(:xero) and xero_invoice_guid
        xero_invoice = $xero.Invoice.find(xero_invoice_guid)
        xero_invoice.status = 'VOIDED'
        xero_invoice.save!
      end
      if Feature.enabled?(:netsuite) and netsuite_invoice_id
        netsuite_invoice = NetSuite::Records::Invoice.get(netsuite_invoice_id)
        netsuite_invoice.update(status: 'VOIDED')
      end
    end
  end

  def remittable
    if Current.user
      if self.changes_to_save['remitted_at'][0].present?
        errors.add(:remitted_at, :already_present, value: self.id)
      elsif self.charged_at.nil? && self.xero_total != 0
        errors.add(:remitted_at, :not_applicable, value: self.id)
      end
    end
  end

  def chargeable
    if Current.user
      if self.changes_to_save['charged_at'][0].present? and not self.declined_at.present?
        errors.add(:charged_at, :already_present, value: self.id)
        return
      end
      if self.remitted_at.present?
        errors.add(:remitted_at, :already_present, value: self.id)
        return
      end
    end
  end

  def forgivable
    if Current.user
      if self.changes_to_save['forgiven_at'][0].present?
        errors.add(:forgiven_at, :already_present, value: self.id)
      end
    end
  end

  def on_charge
    if Current.user
      self.issued_at ||= Time.now
      begin
        if payment_method.charge(self)
          self.remitted_at = Time.now
        end

        self.declined_at = nil
      rescue PaymentDeclinedError
        errors.add :charge, "Payment declined"
        self.declined_at = Time.now
      end
    end
  end


  def charge
    with_lock do
      if charged?
        errors.add :charge, "Payment already charged"
        return
      end
      if remitted?
        errors.add :charge, "Payment already received"
        return
      end

      self.issued_at ||= Time.now

      begin
        if payment_method.charge(self)
          self.remitted_at = Time.now
        end

        self.charged_at = Time.now
        self.declined_at = nil
      rescue PaymentDeclinedError
        errors.add :charge, "Payment declined"
        self.declined_at = Time.now
      end

      self.save!
    end
  end

  def forgive
    with_lock do
      if Feature.enabled?(:xero) and xero_invoice_guid
        xero_invoice = $xero.Invoice.find(xero_invoice_guid)
        xero_invoice.status = 'VOIDED'
        xero_invoice.save
      end
      if Feature.enabled?(:netsuite) and netsuite_invoice_id
        netsuite_invoice = NetSuite::Records::Invoice.get(netsuite_invoice_id)
        netsuite_invoice.update(status: 'VOIDED')
      end
      self.forgiven_at = Time.now
      self.save
    end
  end

  def remit
    return unless self.charged_at || self.xero_total == 0
    self.remitted_at = Time.now
    self.save
  end

  def send_to_invoice_provider
    return unless Feature.enabled? :netsuite
    # Try to prevent sending an invoice to xero twice.

    with_lock do
      self.reload

      return if self.netsuite_invoice_id

      if self.invoice_items.empty?
        self.netsuite_invoice_id = "FAKE_EMPTY_NUMBER_#{self.id}"
        self.netsuite_total = 0
        return self.save
      end

      netsuite_invoice = build_netsuite_invoice

      unless netsuite_invoice.add
        raise "Error saving invoice #{id} to NetSuite: #{netsuite_invoice.errors}"
      end

      self.netsuite_invoice_id = netsuite_invoice.internal_id
      self.save

      fetched_invoice = fetch_netsuite_invoice

      self.netsuite_total = fetched_invoice.total.to_f
      self.netsuite_tax_type = fetched_invoice.tax_item.name
      self.save
    end
  end

  def get_branding_theme(payment_method)
    return nil unless payment_method
    theme_name = case payment_method.type
                 when 'CreditCard' then 'CC'
                 when 'PurchaseOrder' then 'PO'
                 else return nil
                 end
    $xero.BrandingTheme.all.find { |theme| theme.name == theme_name }
  end

  def billing_addresses
    if payment_method.try(:address_id).present?
      [ payment_method.address ]
    else
      organization.addresses
    end
  end

  def build_netsuite_invoice
    NetSuite::Records::Invoice.new(
      entity: { external_id: organization.netsuite_customer_id },
      billing_address: get_first_address,
      status: 'AUTHORISED',
      due_date: DateTime.now + 1.month,
      is_taxable: false,
      other_ref_num: payment_method.try(:po_reference_number),
      department: { internal_id: 10 },
      location: { internal_id: 1 },
      item_list:
        {
          item: invoice_items.map do |item|
            {
              item: { internal_id: item.netsuite_item_id || InvoiceItem::NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY },
              description: "#{item.name}" + (item.description.blank? ? "" : "\n#{item.description}"),
              quantity: item.quantity,
              amount: item.total,
              rate: item.charge.to_s,
              is_taxable: false
            }
          end
        }
    )
  end

  def xero_invoice
    if Feature.enabled? :xero
      if not xero_invoice_guid.blank?
        $xero.Invoice.find(xero_invoice_guid)
      end
    end
  end

  def fetch_netsuite_invoice
    if Feature.enabled? :netsuite
      if not netsuite_invoice_id.blank?
        NetSuite::Records::Invoice.get(netsuite_invoice_id)
      end
    end
  end

  def self.get_or_create!(payment_method, month: nil)
    # Switch time to PST so invoice generation cutoff is end of month midnight PST/PDT
    month   ||= Time.now.in_time_zone('Pacific Time (US & Canada)').strftime("%Y-%m")

    org       = payment_method.organization
    invoice   = Invoice.where(payment_method_id: payment_method.id,
                              organization_id: org.id,
                              month: month).first

    if invoice
      invoice
    else
      Invoice.create!(payment_method_id: payment_method.id,
                      organization_id: org.id,
                      reference: month,
                      month: month)
    end
  end

  def total
    self.xero_total or invoice_items.to_a.sum(&:total)
  end

  def charged?
    charged_at.present? and not declined_at.present?
  end

  def remitted?
    remitted_at.present?
  end

  def contact_user
    organization.owner
  end

  # Create a negative invoice_item for the total of the credit and apply it to the invoice.
  def apply_credit(credit)
    if charged_at.present?
      return "This invoice has already been charged."
    end

    charge = -[ credit.amount_remaining, total ].min
    name   = "Applying credit #{credit.id}: #{credit.name}"

    begin
      transaction do
        InvoiceManager.add_charge(
          name,
          charge,
          payment_method.id,
          invoice_id: self.id,
          credit_id: credit.id
        )
      end
    rescue PaymentRequiredException => e
      return e.message
    end
    nil
  end

  def self.full_json
    opts = short_json
    opts[:include][:invoice_items] = InvoiceItem.short_json
    opts
  end

  def self.short_json
    {
      only: [ :id, :reference, :created_at, :payment_method,
             :xero_invoice_number, :xero_invoice_guid, :forgiven_at, :charged_at, :remitted_at,
             :issued_at, :month, :declined_at, :netsuite_invoice_id ],
      methods: [ :total ],
      include: {
        payment_method: {},
        organization: {
          only: [ :id, :name, :subdomain ],
          methods: [],
          include: {}
        },
        contact_user: {
          only: [ :email ],
          include: {},
          methods: [ :name ]
        }
      }
    }
  end

  def serializable_hash(opts = {})
    opts = Invoice.full_json.merge(opts || {})
    super(opts)
  end

  def get_first_address
    if billing_addresses.any?
      NetSuite::Records::Address.new(
        addressee: organization.name,
        addr1: billing_addresses[0].street,
        addr2: billing_addresses[0].street_2,
        city: billing_addresses[0].city,
        region: billing_addresses[0].state,
        zip: billing_addresses[0].zipcode,
        country: NetSuite::Support::Country.new(billing_addresses[0].country)
      )
    end
  end

  def generate_audit_trail_message(event_type)
    "#{self.class.name} #{self.id} has been charged at #{self.charged_at} for organization #{self.organization_id}"
  end
end
