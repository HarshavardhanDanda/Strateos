class Protocol < ApplicationRecord
  has_snowflake_id('pr')

  audit_trail only: [ :name, :version, :published ]

  def should_index?
    package.releases.last == release
  end

  belongs_to :package
  belongs_to :release
  audited associated_with: :release

  # program to run a the end of the run execution
  belongs_to :program
  # program to run a the end of each instruction in a run
  belongs_to :per_inst_program, class_name: "Program", optional: true

  has_many :runs
  has_many :launch_requests, dependent: :destroy

  has_many :org_protocols

  validates_presence_of :name

  VALID_CATEGORIES = [
    'Protocols',
    'Quick Instructions',
    'Drug Discovery',
    'Chemistry',
    'Synthetic Biology'
  ]

  validate lambda {
    if categories and (cat = categories.find { |c| !VALID_CATEGORIES.include? c })
      errors.add(:categories, "#{cat} is not a valid category")
    end

    [ program, per_inst_program ].each do |prg|
      if prg and prg.organization_id != release.package.organization.id
        errors.add(:program, "Not in same org.")
      end
    end
  }

  def self.public
    visible_to(nil)
  end

  def self.visible_to(org)
    # This would look better as raw SQL and calling `find_by_sql`.
    # The downside with that approach is that it would return an array of results
    # instead of a query object.  By using a query object we can further optimize
    # the query by `including` the packages for example.
    #
    # NOTE: ActiveRecord does not respect the `distinct` clause and will generate
    # bad SQL when calling `count`. Use `length` instead.
    show_private_only = 'packages.public = false AND packages.organization_id = ?'
    show_all = 'packages.public OR packages.organization_id = ?'
    is_visible = (org&.feature_groups&.include? 'hide_public_packages') ? show_private_only : show_all
    Protocol.joins(:package, :release)
            .select('DISTINCT ON (packages.name, protocols.name) protocols.*')
            .where(published: true)
            .where(is_visible, org.try(:id))
            .order(Arel.sql("packages.name, protocols.name, string_to_array(protocols.version, '.')::int[] DESC"))
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def self.full_json
    {
      only: [
        :id, :name, :description, :inputs, :package_id, :package_name, :license, :preview, :command_string,
        :created_at, :categories, :image_url, :validation_url, :display_name, :version, :release_id, :published,
        :logo_url, :program_id
      ],
      include: {
        package: Package.short_json
      },
      methods: []
    }
  end

  def self.short_json
    {
      only: [
        :id, :name, :description, :inputs, :package_id, :package_name, :license, :command_string,
        :created_at, :categories, :image_url, :validation_url, :display_name, :version, :release_id, :published,
        :logo_url, :program_id
      ],
      include: {},
      methods: []
    }
  end

  def self.browser_modal_json
    {
      only: [
        :id, :name, :description, :package_name, :license, :command_string, :created_at, :categories,
        :image_url, :validation_url, :display_name, :version, :release_id, :published, :logo_url, :program_id
      ],
      methods: [],
      include: {
        package: {
          only: [ 'public', 'organization_id' ],
          methods: [],
          include: {}
        }
      }
    }
  end

  def launch(parameters)
    ProtocolLaunchJob.perform_async(id, parameters)
  end

  def serializable_hash(opts = {})
    opts = Protocol.full_json.merge(opts || {})
    super(opts)
  end
end
