class Address < ApplicationRecord
  audit_trail on: [ :create ], only: [ :attention, :street, :city, :state, :country, :zipcode, :organization_id ]

  has_snowflake_id('addr')
  acts_as_paranoid
  belongs_to :organization
  has_many :purchase_orders
  has_many :return_shipments
  has_many :intake_kits

  validates :organization_id, presence: true
  validates :street, presence: true
  validates :state, presence: true
  validates :city, presence: true
  validates :zipcode, presence: true
  validates :country, presence: true
  before_save :has_unique_pair_of_org_id_and_is_default?
  before_destroy :has_purchase_orders?, :used_by_lab?

  def has_purchase_orders?
    if purchase_orders.any?
      error_message = "Cannot delete this address. Currently used in #{purchase_orders.count} purchase order(s)"
      errors.add :association, error_message
      throw(:abort)
    elsif !return_shipments.any? && !intake_kits.any?
      self.really_destroy!
    end
  end

  def has_unique_pair_of_org_id_and_is_default?
    address = Address.where("organization_id = ? and is_default = ?", self.organization_id, true)
    if !address.empty? and self.is_default
      error_message = "Cannot have multiple default addresses for the same organization"
      errors.add :association, error_message
      throw(:abort)
    end
  end

  def used_by_lab?
    unless Lab.find_by_address_id(self.id).nil?
      error_message = "Cannot delete this address. Currently used in #{Lab.find_by_address_id(self.id).name} lab"
      errors.add :association, error_message
      throw(:abort)
    end
  end

  def has_references?
    intake_kits.any? || return_shipments.any?
  end

  def to_s
    "#{self.street} #{self.street_2}, #{self.city}, #{self.state} #{self.zipcode}, Attn #{self.attention}"
  end

  def label_text
    text = "#{organization.name}\nAttn: #{attention}\n#{street}\n"
    unless street_2.blank?
      text += "#{street_2}\n"
    end
    text += "#{city}, #{state} #{zipcode}"
    if country != 'US'
      text += "\n#{country}"
    end
    text
  end

  def to_address
    streets = [ self.street ]
    streets += [ self.street_2 ] if not self.street_2.nil?
    Shipping::Address.new(
      address_lines: streets,
      city: self.city,
      state: self.state,
      zip: self.zipcode,
      country: self.country,
      is_default: self.is_default
    )
  end

  def serializable_hash(opts = {})
    opts = {
      only: [ :id, :attention, :street, :street_2, :state, :city, :zipcode, :country ]
    }.merge(opts || {})
    super(opts)
  end

end
