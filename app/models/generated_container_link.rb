class GeneratedContainerLink < ApplicationRecord
  belongs_to :instruction
  belongs_to :container

  validates_presence_of :instruction
  validates_presence_of :container
end
