class User < ApplicationRecord
  has_snowflake_id('u')
  audited only: [ :email, :encrypted_password, :first_name, :last_name, :rsa_public_key ]

  has_many :uploads, as: :user
  has_many :collaborations, :class_name => 'Collaborator', :as => :collaborating
  has_many :favorites
  has_many :organization_collaborations,
           -> { where collaborative_type: 'Organization' },
           :class_name => 'Collaborator',
           :as => :collaborating
  has_many :organizations,
           :through => :organization_collaborations,
           :source => :collaborative,
           :source_type => 'Organization'
  has_many :addresses, :through => :organizations
  has_many :projects, :through => :organizations
  has_many :runs, :through => :projects
  has_many :packages, foreign_key: :owner_id
  has_many :launch_requests
  has_many :favorite_projects, through: :favorites, source: :favorable, source_type: 'Project'
  has_many :favorite_protocols, through: :favorites, source: :favorable, source_type: 'Protocol'

  searchkick batch_size: 200, word_start: [ :id, :email, :name ], callbacks: :async

  devise :two_factor_authenticatable, :invitable, :database_authenticatable, :registerable,
         :recoverable, :trackable, :validatable, :confirmable,
         :lockable, :timeoutable, :confirm_within => 1.week

  has_one_time_password

  attr_accessor :enable_two_factor_auth, :disable_two_factor_auth

  validates_presence_of :first_name
  validates_inclusion_of :two_factor_auth_delivery_mode, in: [ 'app' ]
  validate :password_complexity

  def password_complexity
    # only validate on change since by default the password field is nil
    # we use encrypted_password field since password field isn't stored.
    return if !will_save_change_to_encrypted_password?

    error_strs = StringUtil.validate_password(password)
    error_strs.each { |error| self.errors.add(:password, error) }
  end

  after_create :rotate_api_key

  before_save lambda {
    if self.saved_change_to_encrypted_password?
      self.password_last_changed_at = Time.now
    end
  }

  # TODO: remove after pricing changes land
  # Users will default to not having these features.
  after_create lambda {
    # we want to fix test that will fail first.
    return if Rails.env == 'test'

    self.feature_groups ||= []
    self.save!
  }

  SHORT_JSON = {
    only: [ :id, :email ],
    methods: [ :name, :profile_img_url ],
    include: {}
  }.freeze

  def self.public_json
    {
      only: [
        :id, :email
      ],
      methods: [ :name, :profile_img_url ],
      include: []
    }
  end

  def self.collaborator_json
    {
      only: [ :id, :email, :created_at ],
      methods: [ :name, :two_factor_auth_enabled?, :locked_out?, :profile_img_url ],
      include: {}
    }
  end

  def self.full_json
    FULL_JSON
  end

  FULL_JSON = {
    only: [
      :id, :email, :two_factor_auth_enabled, :gravatar_url,
      :password_last_changed_at, :authentication_token, :rsa_public_key, :created_at,
      :is_developer, :requested_developer_access_at, :developer_access_granted_at,
      :notify_for_intake_kit_shipped,
      :notify_for_my_intake_kit_shipped,
      :notify_for_my_run_schedule,
      :notify_for_my_run_status,
      :notify_for_my_shipment_checked_in,
      :notify_for_org_run_schedule,
      :notify_for_org_run_status,
      :notify_for_shipment_checked_in,
      :notify_for_stale_container,
      :last_sign_in_ip,
      :last_sign_in_at,
      :invitation_sent_at,
      :invitation_accepted_at
    ],
    methods: [ :name, :locked_out?, :feature_groups, :profile_img_url ],
    include: {
      organizations: Organization::SHORT_JSON,
      collaborations: Collaborator.short_json
    }
  }.freeze

  def search_data
    searchkick_as_json(User::FULL_JSON)
  end

  def system_admin?
    false
  end

  def locked_out?
    self.second_factor_attempts_count >= 3 or self.locked_at
  end

  def enable_two_factor_auth=(_data)
    self.two_factor_auth_enabled = true
  end

  def disable_two_factor_auth=(_data)
    self.two_factor_auth_enabled = false
  end

  def need_two_factor_authentication?(_request)
    # If user has 2fa explicitly enabled, honor it, regardless of environment
    self.two_factor_auth_enabled? ||
      (!(Rails.env.development? || Rails.env.staging?) && self.organizations.map(&:two_factor_auth_enabled).any?)
  end

  def send_two_factor_authentication_code(otp_code)
    # use Model#otp_code and send via SMS, etc.
  end

  def totp_enabled?
    true
  end

  def maybe_set_otp
    unless self.otp_secret_key?
      self.otp_secret_key = self.generate_totp_secret
      self.save!
    end
  end

  def administrator?(user)
    self.organizations.map(&:admins).flatten.uniq.member?(user)
  end

  def member_of_org?(org)
    # check for membership using ids, as sometimes the activerecord
    # cache objects don't evaluate as true even though the most certainly are.
    ids = self.organizations.pluck(:id)
    ids.member?(org.try(:id))
  end

  #
  # Developer Access
  #
  def request_developer_access
    self.requested_developer_access_at = Time.now
    self.grant_developer_access
  end

  def deny_developer_request
    self.requested_developer_access_at = nil
    self.save
  end

  def grant_developer_access
    self.is_developer = true
    self.developer_access_granted_at = Time.now
    self.save
  end

  def revoke_developer_access
    self.is_developer = false
    self.developer_access_granted_at = nil
    self.save
  end

  def rotate_api_key
    self.authentication_token = Devise.friendly_token
    self.save
  end

  # setter to make sure we store a valid public key
  def rsa_public_key=(key_string)
    if key_string.nil?
      super(nil)
    else

      begin
        key = OpenSSL::PKey::RSA.new key_string
      rescue StandardError => e
        raise ArgumentError, 'Unable to parse key: ' + e.message
      end

      if key.private?
        raise ArgumentError, 'Private key, rather than public key, provided'
      end

      super(key.public_key.export)
    end
  end

  def request_signing_configured?
    rsa_public_key.present?
  end

  def validate_signature!(key_id:, date:, signing_string:, signature:)

    if self.rsa_public_key.nil?
      raise "Bad RSA Signature: Signature cannot be verified as the user has no assigned RSA public key"
    elsif !key_id.casecmp?(self.email.downcase)
      raise "Bad RSA Signature: Signature keyId is incorrect (does not match user email)"
    end

    key = OpenSSL::PKey::RSA.new(self.rsa_public_key)

    decoded = Base64.strict_decode64(signature)

    verified = key.verify(
      OpenSSL::Digest.new('SHA256'),
      decoded,
      signing_string.encode("ascii")
    )

    if not verified
      raise "Bad RSA Signature: Signature cannot be verified, "\
            "check you are using the correct private key, and that your signing string is correct"
    else
      verified
    end
  end

  def self.find_by_email_and_validate_token(email, token)
    user = self.find_by_email(email)

    return nil if user.nil?

    if Devise.secure_compare(token, user.authentication_token)
      user
    else
      nil
    end
  end

  def admin?(organization)
    organization.owner == self
  end

  def transcriptic_user?
    self.email.include?("@transcriptic.com")
  end

  def should_track?
    !transcriptic_user?
  end

  def enable_feature_group(group)
    self.feature_groups << group
    self.feature_groups_will_change!
    save
  end

  def gravatar_url
    gravatar_id = Digest::MD5.hexdigest(email.downcase)
    "http://gravatar.com/avatar/#{gravatar_id}.png?s=140"
  end

  def profile_img_url
    return nil if self.profile_img_s3_bucket.nil? || self.profile_img_s3_key.nil?

    "https://static-public.transcriptic.com/#{self.profile_img_s3_key}"
  end

  def serializable_hash(opts = {})
    opts = FULL_JSON.merge(opts || {})
    super(opts)
  end

  def name
    "#{self.first_name} #{self.last_name}".strip
  end

  def name=(name)
    first, last = name.split(' ', 2)
    self.first_name = first
    self.last_name  = last
  end

  def self.globally_remove_feature_flag(flag)
    User.transaction do
      User.where("? = ANY(feature_groups)", flag).each do |user|
        user.feature_groups = (user.feature_groups || []) - [ flag ]
        user.save!
      end
    end
  end

  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  def find_main_org
    # Find main organization preferring ownership and submitted runs.

    organizations = self.organizations

    return nil if organizations.empty?

    # Sort by ownership and by runs submitted.
    sorted_orgs = organizations.sort_by do |org|
      owns_org     = org.owner_id == self.id ? 1 : 0
      org_run_size = Run.joins(project: :organization)
                        .where(owner_id: self.id, organizations: { id: org.id })
                        .size

      [ owns_org, org_run_size ]
    end

    sorted_orgs.last
  end

  def devise_mailer
    UserMailer
  end

  def is_internal_user?
    Organization.joins(:collaborators)
                .where(test_account: true)
                .where(collaborators: { collaborating_id: self.id })
                .exists?
  end

  def create_password_reset_token
    # generates a new token without sending an email
    token = self.set_reset_password_token

    token
  end

  def any_org_feature_groups_include?(feature_group)
    self.organizations.any? { |org| org.feature_groups.include?(feature_group) }
  end

  def toggle_favorite(favorable, is_starred)
    exists = self.favorites.exists?(favorable: favorable)
    if !exists && is_starred
      self.favorites.create(favorable: favorable)
    elsif exists && !is_starred
      self.favorites.where(favorable: favorable).destroy_all
    end
  end

end
