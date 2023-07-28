class Favorite < ApplicationRecord
  belongs_to :user
  belongs_to :favorable, :polymorphic => true

  validates_presence_of :user
  validates_presence_of :favorable
  validates_uniqueness_of :user_id, :scope => [ :favorable_id, :favorable_type ]

  after_destroy lambda {
    if self.favorable_type == 'Project'
      Project.find(self.favorable_id).reindex
    end
  }

  after_create lambda {
    if self.favorable_type == 'Project'
      Project.find(self.favorable_id).reindex
    end
  }

end
