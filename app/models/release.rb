class Release < ApplicationRecord
  has_snowflake_id('re')

  belongs_to :package
  has_many :protocols
  audited associated_with: :package
  has_associated_audits

  validates_presence_of :binary_attachment_url

  if Rails.env.test?
    after_create :background_parse
  else
    after_commit :background_parse, on: :create
  end

  after_save lambda {
    package.update_latest
  }

  after_destroy lambda {
    package.update_latest
  }

  before_destroy lambda {
    if Run.joins(protocol: :release).where(releases: { id: self.id }).exists?
      errors.add :base, 'Cannot delete a release that has protocols which have generated runs.'
      throw(:abort)
    else
      protocols.map(&:destroy)
      true
    end
  }

  state_machine :status, initial: :new do
    state :new
    state :manifested
    state :validated
    state :failed
  end

  def self.full_json
    {
      only: [
        :id, :version, :signature, :format, :manifest, :validation_progress, :validation_errors,
        :published, :created_at
      ],
      include: {
        package: Package.short_json,
        protocols: Protocol.short_json
      },
      methods: [ :num_protocols ]
    }
  end

  def self.short_json
    {
      only: [
        :id, :version, :signature, :format, :manifest, :validation_progress, :validation_errors,
        :published, :created_at, :package_id
      ],
      include: {},
      methods: [ :num_protocols ]
    }
  end

  def num_protocols
    protocols.count
  end

  def background_parse
    ParseReleaseJob.perform_async(self.id)
  end

  def serializable_hash(opts = {})
    opts = Release.full_json.merge(opts || {})
    super(opts)
  end
end
