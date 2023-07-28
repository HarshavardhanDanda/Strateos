class Notebook < ApplicationRecord
  has_snowflake_id('nb')

  self.inheritance_column = nil

  belongs_to :user
  belongs_to :project

  before_create lambda {
    self.path = "#{id}.ipynb"
  }

  def created
    self.created_at
  end

  def last_modified
    self.updated_at
  end

  def writable
    true
  end

  def format
    'json'
  end

  def type
    'notebook'
  end

  # this, and several other methods, may be unnecessary at this point
  # would like to test this theory once local-dev notebooks work again
  def mimetype
    nil
  end

  def fork(to_user)
    new_notebook = self.dup
    new_notebook.created_at = nil
    new_notebook.user = to_user
    new_notebook.forked_parent_id = self.id

    new_notebook
  end

  def serializable_hash(opts = {})
    opts = {
      only: [ :id, :name, :path, :user_id ],
      methods: [ :type, :format, :created, :last_modified, :writable, :mimetype ],
      include: {
        user: {
          only: [ :id, :email ],
          methods: [ :name ],
          include: []
        }
      }
    }.merge(opts || {})
    super(opts)
  end
end
