class Organization < ApplicationRecord
  has_snowflake_id('org')
  has_associated_audits
  audit_trail on: [ :update ], only: [ :two_factor_auth_enabled ]

  ORG_TYPE = { CL: 'CL', CCS: 'CCS' }.freeze

  belongs_to :owner, class_name: 'User'
  belongs_to :account_manager, class_name: 'Admin'
  has_and_belongs_to_many :subscribers, class_name: 'Admin', join_table: :organizations_subscribers
  has_many :projects, dependent: :destroy
  has_many :collaborators, as: :collaborative, dependent: :destroy
  has_many :users, :through => :collaborators, :source => :collaborating, :source_type => "User"
  has_many :addresses, dependent: :destroy
  has_many :resources, dependent: :destroy
  has_many :shipments, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :compound_links
  has_many :invoice_items, dependent: :destroy
  has_many :runs, through: :projects
  has_many :labels, dependent: :destroy
  has_many :lab_consumers, dependent: :destroy
  has_many :kits
  has_many :materials
  has_many :labs, :through => :lab_consumers
  has_many :contextual_custom_properties_configs

  has_many :active_runs,
           -> { where "completed_at is null and status not in ('canceled', 'aborted')" },
           through: :projects,
           class_name: 'Run'

  has_many :completed_runs,
           -> { where("status = 'completed' and completed_at is not null") },
           through: :projects, class_name: 'Run'

  has_many :payment_methods, dependent: :destroy
  has_many :valid_payment_methods, -> { all_valid }, class_name: 'PaymentMethod'
  belongs_to :default_payment_method, class_name: 'PaymentMethod'
  has_many :containers, dependent: :destroy
  has_many :aliquots, through: :containers
  has_many :stale_containers, through: :containers
  has_many :kit_requests
  has_many :credits
  has_many :packages
  has_many :intake_kits
  has_many :billing_contacts
  has_many :vendors, dependent: :destroy
  has_many :suppliers, dependent: :destroy
  has_many :org_protocols
  has_many :libraries

  validates_presence_of :name
  validates_presence_of :subdomain
  validates_exclusion_of :subdomain, :in => [ 'new', 'update', 'edit',
                                             'protocols', 'inventory', 'datasets' ]
  validates :subdomain, length: { in: 4..120 }
  validates :org_type,
            inclusion: { in: ORG_TYPE.values,
                         message: "%{value} is not a valid org type (#{ORG_TYPE.values})" }
  validates_format_of :subdomain, :with => /\A[-a-zA-Z0-9\_]+\z/
  validates_uniqueness_of :subdomain
  validates_inclusion_of :plan, :in => [ 'free', 'professional', 'enterprise' ]
  validates_inclusion_of :run_approval, :in => [ 'never', 'budget', 'cost', 'always' ]
  validates_inclusion_of :org_type_prefix, :in => [ 'org', 'com' ]

  validate :account_manager_is_valid

  validate lambda {
    if saved_change_to_default_payment_method_id?
      return if default_payment_method_id.nil?

      err = default_payment_method.validation_error

      if err
        errors.add(:default_payment_method, err)
      end
    end
  }


  before_destroy :delete_organization_acs

  after_create :provision_billing unless Rails.env.development? || Rails.env.staging?
  after_create :provision_account
  after_create :provision_metadata
  after_destroy :refresh_search_index
  after_create :create_related_resources

  def create_related_resources
    if Current.user

      Project.create!(
        name: "Default Project",
        visibility: 'organization',
        creating_user: self.owner,
        organization: self
      )

      collaborator = Collaborator.create!(
        collaborating: self.owner,
        collaborative: self
      )
    end
  end

  def refresh_search_index
    Organization.search_index.refresh
  end

  searchkick batch_size: 200, word_start: [ :name, :subdomain ], callbacks: :async

  def search_data
    searchkick_as_json(Organization.flat_json)
  end

  def account_manager_is_valid
    manager = account_manager_or_default
    if !manager.nil? && !manager.account_managerable?
      errors[:account_manager_id] << "Account manager must be an admin that can manage accounts."
    end
  end

  def self.flat_json
    { only: self.column_names, include: {},
     methods: [ :num_collaborators, :run_stats, :container_stats ] }
  end

  SHORT_JSON = {
    only: [ :id, :name, :subdomain, :profile_photo_attachment_url, :test_account, :netsuite_customer_id,
:feature_groups, :org_type ],
    include: {
      projects: {
        only: [ :id, :name, :created_at, :updated_at, :archived_at ],
        include: {},
        methods: {}
      }
    },
    methods: [ :group ]
  }.freeze

  FULL_JSON = {
    only: [
      :id, :name, :subdomain, :profile_photo_attachment_url, :metadata_schema, :test_account,
      :created_at, :owner_id, :netsuite_customer_id, :two_factor_auth_enabled, :api_key, :signals_api_key,
      :signals_tenant, :feature_groups, :org_type
    ],
    include: {
      owner: {
        only: [ :email ],
        methods: [ :name ],
        include: {}
      },
      collaborators: {
        only: [ :id ],
        include: {
          collaborating: {
            only: [ :id, :email ],
            include: [],
            methods: [ :name ]
          }
        }
      },
      projects: {
        only: [ :id, :name, :created_at, :updated_at, :archived_at ],
        include: {},
        methods: []
      },
      addresses: {
        except: [ :organization_id ],
        include: {},
        methods: []
      }
    },
    methods: [ :new_here?, :billing_valid?, :group, :run_stats, :num_collaborators, :validated?,
:account_manager_or_default ]
  }.freeze

  ADMIN_JSON = {
    only: [ :id, :name, :subdomain, :profile_photo_attachment_url, :metadata_schema, :created_at,
:netsuite_customer_id, :org_type ],
    include: {
      collaborators: {
        only: [ :id ],
        include: {
          collaborating: {
            only: [ :id, :email, :created_at ],
            include: [],
            methods: [ :name, :two_factor_auth_enabled?, :locked_out? ]
          }
        }
      },
      projects: {
        only: [ :id, :name, :created_at, :updated_at, :archived_at ]
      },
      addresses: {
        except: [ :organization_id ]
      }
    },
    methods: [ :new_here?, :billing_valid?, :group, :validated?, :account_manager_or_default ]
  }.freeze

  DefaultMetadataSchema = {
    "aliquots" => {
      'External ID' => 'string',
      'Lot' => 'string',
      'Expiry' => 'string'
    },
    "resources" => {
      'External ID' => 'string',
      'Common Name' => 'string',
      'IUPAC Name' => 'string',
      'CAS number' => 'string',
      'ATC code' => 'string'
    }
  }.freeze

  def add_metadata_keys=(keys)
    keys.each do |key|
      if not self.metadata_schema.keys.member? key["table"]
        self.metadata_schema[key["table"]] = {}
      end
      self.metadata_schema[key["table"]][key["key"]] = key["kind"]
    end
    self.metadata_schema_will_change!
  end

  def delete_metadata_keys=(keys)
    keys.each do |key|
      self.metadata_schema[key["table"]].delete(key["key"])
    end
    self.metadata_schema_will_change!
  end

  def self.exclude_internal_users
    where('test_account is null or not test_account')
  end

  def self.find_by_id_or_subdomain!(id)
    find_by!("id = ? OR subdomain = ?", id, id)
  end

  def run_stats
    {
      total: self.runs.count,
      open: self.runs.where(status: [ 'accepted', 'in_progress', 'new', 'pending' ]).count()
    }
  end

  def container_stats
    {
      total: self.containers.count
    }
  end

  def num_collaborators
    self.collaborators.count
  end

  def to_param
    subdomain
  end

  def should_track?
    !test_account?
  end

  def admins
    collaborator_users_ids = self.collaborators.map(&:collaborating_id)
    data = {}
    data[:userIds] = collaborator_users_ids
    data[:featureCode] = ADMINISTRATION
    data[:contextIds] = [ self.id ]

    permissions = JSON.parse(ACCESS_CONTROL_SERVICE.permission_summary(User.find(collaborator_users_ids.first), self,
data))
    admin_user_ids = permissions&.map { |p| p['userId'] }&.uniq || []
    User.where(id: admin_user_ids)
  end

  def owner
    User.find(self.owner_id)
  end

  def email
    owner.email
  end

  def new_here?
    self.runs.count < 1
  end

  def provision_metadata
    self.update(metadata_schema: DefaultMetadataSchema)
  end

  def delete_organization_acs
    if Current.user
      data = {}
      data[:organizationId] = id
      ACCESS_CONTROL_SERVICE.delete_organization(Current.user, self, data)
    end
  end

  def provision_billing
    data = {
      description: name
    }

    if users.count > 0
      data[:email] = users.first.email # not perfect
    end

    if self.stripe_customer_id.nil?
      customer                = Stripe::Customer.create(data)
      self.stripe_customer_id = customer.id

      self.save
    end
  end

  def stripe_customer!
    Stripe::Customer.retrieve(self.stripe_customer_id)
  end

  def stripe_customer
    if @stripe_customer_cache.nil?
      @stripe_customer_cache = stripe_customer!
    end

    @stripe_customer_cache
  end

  def xero_contact
    if xero_contact_id
      contact = $xero.Contact.find(xero_contact_id)
    else
      contact = $xero.Contact.build(name: "#{name} (#{id})")
      if contact.save
        self.xero_contact_id = contact.contact_id
        self.save
      else
        raise "Contact was not saved to Xero: #{customer.errors}"
      end
    end
    contact
  end

  def average_monthly_spending
    return 0.0 if invoices.empty?

    totals = invoices.map(&:total)
    (totals.sum / totals.count).to_f
  end

  def group
    "#{self.org_type_prefix}.#{self.subdomain}"
  end

  def provision_account
    self.api_key = SecureRandom.hex
    self.save
  end

  def user_can_view?(user)
    return true if self.owner_id == user.id

    not self.collaborators.where(collaborating_id: user.id, collaborating_type: "User").empty?
  end

  def admin?(user)
    return true if self.owner_id == user.id

    permissions = ACCESS_CONTROL_SERVICE.user_acl(user, self)
    permissions && permissions["org_ctx_permissions"]&.include?(ADMINISTRATION)
  end

  def account_manager_or_default
    account_manager || Admin.find_by_email('sales@transcriptic.com')
  end

  # TODO: repalce me with something that returns data points
  def data
    []
  end

  def billing_valid?
    self.valid_payment_methods.count > 0
  end

  def default_payment_method_valid?
    if self.default_payment_method.nil?
      false
    else
      not self.default_payment_method.validation_error
    end
  end

  def address_valid?
    not addresses.empty?
  end

  def validated?
    billing_valid? and address_valid?
  end

  def serializable_hash(opts = {})
    opts = FULL_JSON.merge(opts || {})
    super(opts)
  end

  def can_create_consumable?
    self.feature_groups.include? 'can_create_consumable'
  end

  def assign_lab(lab_attrs)
    lab = nil
    case lab_attrs[:org_type]
    when 'CCS'
      lab = Lab.create!(name: 'Default Lab', operated_by: self)
    when 'CL'
      lab = Lab.find(lab_attrs[:lab_id])
    end
    lab.lab_consumers.create(organization: self)
  end

end
