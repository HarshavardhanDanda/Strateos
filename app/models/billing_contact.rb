class BillingContact < ApplicationRecord
  belongs_to :organization
  devise :confirmable

  validates :name, presence: true
  validates :email, presence: true
  validates :email, uniqueness: { scope: :organization_id }

  def devise_mailer
    BillingContactMailer
  end

  def self.full_json
    {
      only: [ :id, :name, :email, :organization_id, :confirmed_at, :created_at, :updated_at ],
      methods: [],
      include: []
    }
  end
end
