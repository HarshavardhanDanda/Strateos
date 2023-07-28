class Admin < ApplicationRecord
  has_snowflake_id 'ad'

  has_many :uploads, as: :user

  searchkick batch_size: 200, callbacks: :async

  if Rails.env.development? || Rails.env.staging?
    devise :database_authenticatable, :saml_authenticatable, :validatable
    validate :password_complexity
  else
    devise :saml_authenticatable
    validates :email, presence: true, uniqueness: true, format: { with: Devise.email_regexp }
  end

  devise :lockable, :timeoutable, :recoverable, :rememberable, :trackable

  def password_complexity
    # only validate on change since by default the password field is nil
    # we use encrypted_password field since password field isn't stored.
    return if !will_save_change_to_encrypted_password?

    error_strs = StringUtil.validate_password(password)
    error_strs.each { |error| self.errors.add(:password, error) }
  end

  # I get what's happening here, but =[
  def system_admin
    system_admin?
  end

  def system_admin?
    true
  end

  def account_managerable?
    account_managerable
  end

  def feature_groups
    []
  end

  def find_main_org
    Organization.find_by_subdomain('transcriptic')
  end

  # Only some admins have authentication_tokens
  def rotate_api_key
    self.authentication_token = Devise.friendly_token
    self.save
  end

  def self.find_by_email_and_validate_token(email, token)
    admin = self.find_by_email(email)

    return nil if admin.nil?

    if Devise.secure_compare(token, admin.authentication_token)
      admin
    else
      nil
    end
  end

  def create_password_reset_token
    # generates a new token without sending an email
    token = self.set_reset_password_token

    token
  end

  def serializable_hash(opts = nil)
    super({
      only: [ :name, :email, :id, :account_managerable, :can_create_admins, :permissions ],
      methods: [ :system_admin ]
    }.merge(opts || {}))
  end
end
