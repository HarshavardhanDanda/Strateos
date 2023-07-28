class Post < ApplicationRecord
  belongs_to :conversation
  belongs_to :author, foreign_key: 'author_id', polymorphic: true

  def self.full_json
    {
      only: [ :id, :conversation_id, :author_type, :viewable_by_users, :text, :attachments, :created_at ],
      include: {
        author: {
          only: [ :id, :name, :is_staff ]
        }
      }
    }
  end

  def author_name
    if author_type == "User"
      author.name
    else
      "Transcriptic Operator"
    end
  end

  def assign_author(user)
    self.author = user
    conversation.add_participant user.id
  end
end
