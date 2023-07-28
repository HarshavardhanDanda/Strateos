class Package < ApplicationRecord
  has_snowflake_id('pk')
  acts_as_paranoid
  audited
  has_associated_audits

  audit_trail only: [ :owner_id ]

  belongs_to :owner, class_name: 'User'
  belongs_to :organization
  has_many :protocols, dependent: :destroy
  has_many :releases, dependent: :destroy
  belongs_to :latest_release, class_name: 'Release'

  def self.full_json
    {
      only: [ :id, :name, :description, :created_at, :public, :organization_id ],
      include: {
        owner: User.public_json,
        releases: Release.full_json
      }
    }
  end

  def self.short_json
    # don't include releases here; leads to recursive includes in other models
    {
      only: [ :id, :name, :description, :created_at, :public, :organization_id ],
      include: {
        owner: User.public_json
      },
      methods: [ :release_count, :latest_version ]
    }
  end

  def new_version?(data)
    return false if data.nil?

    if not data[:package].present?
      errors.add(:package, "bad packaging!")
      return false
    end

    if not data[:package][:version].present?
      errors.add(:version, "no version given")
      return false
    end

    semver =
      begin
        Semantic::Version.new(data[:package][:version])
      rescue
        nil
      end

    if not semver
      errors.add(:version, "invalid '#{semver}'")
      return false
    end

    if self.uploaded_packages.keys.member? semver
      errors.add(:version, "'#{semver}' already exists")
      return false
    end

    true
  end

  def update_latest
    self.latest_release_id = releases.order('created_at DESC').last.try(:id)
    self.save
  end

  def release=(r)
    self.releases << r
  end

  def release_count
    releases.size
  end

  def latest_version
    latest_release.try(:id)
  end

  def serializable_hash(opts = {})
    opts = Package.full_json.merge(opts || {})
    super(opts)
  end
end
