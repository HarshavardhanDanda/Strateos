class Collaborator < ApplicationRecord
  acts_as_paranoid

  belongs_to :collaborating, :polymorphic => true
  belongs_to :collaborative, :polymorphic => true

  validates_presence_of   :collaborating
  validates_presence_of   :collaborative
  validates_presence_of   :collaborative_type
  validates_uniqueness_of :collaborating_id, :scope => [ :collaborative_id, :collaborative_type ]

  after_destroy :reindex_user

  scope :by_email, lambda { |email|
    joins("INNER JOIN users
      ON users.id = collaborators.collaborating_id
      AND collaborators.collaborating_type = 'User'").where("users.email LIKE ?", email)
  }

  attr_accessor :name, :email

  def organization
    return nil if collaborative_type != "Organization"

    collaborative.as_json(Organization::SHORT_JSON)
  end

  def reindex_user
    if collaborating.instance_of?(User)
      collaborating.reindex(refresh: true)
    end
  end

  def self.flat_json
    { only: self.column_names, include: {}, methods: [] }
  end

  def self.full_json
    {
      only: [ :id, :collaborating_id, :created_at,
             :updated_at, :collaborative_id, :collaborative_type, :collaborating_type ],
      methods: [ :organization ],
      include: {
        :collaborating => {
          only: [ :id, :email, :created_at ],
          methods: [ :name, :two_factor_auth_enabled?, :locked_out? ],
          include: {}
        }
      }
    }
  end

  def self.short_json
    {
      only: [ :id, :collaborating_id, :created_at,
             :updated_at, :collaborative_id, :collaborative_type, :collaborating_type ],
      methods: [ :organization ],
      include: {
        :collaborating => {
          only: [ :id, :email, :created_at ],
          methods: [ :name, :two_factor_auth_enabled?, :locked_out? ],
          include: {}
        }
      }
    }
  end

end
