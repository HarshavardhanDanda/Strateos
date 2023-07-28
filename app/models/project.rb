class Project < ApplicationRecord
  has_snowflake_id('p')
  audited associated_with: :organization

  audit_trail only: [ :name ]

  alias_attribute :is_implementation, :is_hidden

  belongs_to :organization
  has_many :collaborators, as: :collaborative, dependent: :destroy
  has_many :users, through: :collaborators, :source => :collaborating, :source_type => "User"
  has_many :runs, -> { order 'created_at DESC' }, dependent: :destroy
  has_many :favorites, as: :favorable, dependent: :destroy
  has_many :runs_without_large_columns, lambda {
    without_large_columns.order(created_at: :DESC)
  }, class_name: 'Run'

  has_many :active_runs, -> { where completed_at: nil }, :class_name => "Run"
  has_many :completed_runs, -> { where "completed_at is not null" }, :class_name => "Run"

  has_many :datasets, dependent: :destroy
  has_many :notebooks, dependent: :destroy
  belongs_to :payment_method
  has_many :favorited_users, through: :favorites, source: :user

  validates_presence_of :name
  validates_uniqueness_of :name, :scope => [ :organization_id ],
                          message: "Project name must be unique within an organization"
  validates_presence_of :organization
  # private = no visibility, seed with creating user as first collaborator.
  # organization = everyone in the owning organization can see.
  validates_inclusion_of :visibility, :in => [ 'public', 'private', 'organization' ]

  validates_associated :payment_method

  before_save lambda {
    if will_save_change_to_payment_method_id?
      return if payment_method_id.nil?

      if !PaymentMethod.exists?(payment_method_id)
        errors.add(:payment_method_id, :invalid_id)
        raise ActiveRecord::RecordInvalid.new(self)
      elsif PaymentMethod.exists?(payment_method_id) && payment_method.organization_id != organization_id
        errors.add(:payment_method_id, :organization_mismatch, value: payment_method_id)
        raise ActiveRecord::RecordInvalid.new(self)
      end

      err = payment_method.validation_error

      if err
        errors.add(:payment_method, err)
        raise ActiveRecord::RecordInvalid.new(self)
      end
    end
  }

  before_destroy :check_for_runs, prepend: true

  def check_for_runs
    if runs.any?
      errors.add(:base, "Can't delete a project with runs")
      throw(:abort)
    end
  end

  searchkick(batch_size: 200, callbacks: :async, word_middle: [ :name, :run_ids ])

  def search_data
    searchkick_as_json(Project.flat_json)
      .merge(
        favorite_of: self.favorited_users.map { |user| user.id },
        run_ids: runs.pluck(:id),
        name: self.name.downcase
      )
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [ :is_implementation ] }
  end

  def to_full_json
    base_json = as_json(Project.base_json)

    runs_json = runs_without_large_columns.select("properties").as_json(
      only: Run.non_json_column_names + [ 'properties' ],
      methods: [ :billing_valid? ],
      include: {
        owner: User.public_json
      }
    )

    base_json[:runs] = runs_json
    base_json
  end

  def self.base_json
    {
      only: [ :id, :name, :event_stream_settings, :webhook_url, :payment_method_id, :created_at, :updated_at,
              :archived_at, :bsl, :organization_id ],
      include: {
        users: {},
        payment_method: {},
        organization: {
          only: [ :id, :name ],
          methods: [],
          include: {}
        }
      },
      methods: [ :visibility_in_words, :run_count, :is_implementation ]
    }
  end

  def self.short_json
    {
      only: [ :id, :name, :created_at, :archived_at, :bsl, :organization_id ],
      include: {
        organization: {
          only: [ :id, :name ],
          methods: [],
          include: {}
        }
      },
      methods: [ :run_count, :is_implementation ]
    }
  end

  def self.mini_json
    {
      only: [ :id, :name, :archived_at, :bsl ],
      methods: [ :is_implementation ],
      include: {
        organization: {
          only: [ :id, :name, :subdomain, :archived_at ],
          methods: [],
          include: {}
        }
      }
    }
  end

  attr_accessor :creating_user

  before_validation(on: :create) do
    set_snowflake_id
  end

  def can_be_seen_by?(user)
    user.organizations.member?(self.organization)
  end

  # TODO: replace with actual actual data lookup
  def data
    []
  end

  def visibility_in_words
    if self.visibility == "public"
      'Public'
    elsif self.visibility == "organization"
      'Organization-wide'
    else
      self.collaborators.map { |collab| collab.collaborating.name }.join(", ")
    end
  end

  RUN_COUNT_STATUSES = Run::STATES - [ :billed, :declined, :canceled ] + [ :test_mode ].freeze
  RUN_COUNT_BY_STATUS_TEMPLATE = Hash[RUN_COUNT_STATUSES.zip([ 0 ] * RUN_COUNT_STATUSES.size)].freeze
  private_constant :RUN_COUNT_STATUSES
  private_constant :RUN_COUNT_BY_STATUS_TEMPLATE

  def run_count
    runs.each_with_object(RUN_COUNT_BY_STATUS_TEMPLATE.deep_dup) do |item, acc|
      acc[item.status.to_sym] += 1 if acc.key? item.status&.to_sym
      acc[:test_mode] += 1 if item.test_mode?
    end
  end

  def subscriber_ids
    [ self.id, self.organization_id ]
  end

  def has_valid_payment_method?
    return true if self.organization.test_account

    if self.payment_method.nil?
      self.organization.default_payment_method_valid?
    else
      not self.payment_method.validation_error
    end
  end

  def bsl2?
    bsl == 2
  end

  def break_run_links
    runs.each do |run|
      run.successors&.each do |successor|
        if successor.project.id != self.id
          successor.update!(predecessor_id: nil)
        end
      end
      if run.predecessor.present? && run.predecessor.project.id != self.id
        run.update!(predecessor_id: nil)
      end
    end
  end

  def transfer(organization)
    self.break_run_links
    self.update!({ organization_id: organization.id,
                   payment_method_id: organization.default_payment_method_id })
  end
end
