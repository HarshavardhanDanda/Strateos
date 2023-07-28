class Conversation < ApplicationRecord
  has_snowflake_id('conv')
  has_many :posts
  belongs_to :organization
  has_one :run

  before_save lambda {
    self.participants = self.participants.compact.uniq
  }

  def self.mini_json
    {
      only: [ :id ],
      methods: [ :post_ids ]
    }
  end

  def post_ids
    posts.map(&:id)
  end

  def participants_serialized
    participants.map { |id|
      Admin.find_by_id(id) || User.find_by_id(id)
    }.compact
  end

  def add_participant(user_id)
    participants_will_change!
    participants << user_id
    save
  end

end
