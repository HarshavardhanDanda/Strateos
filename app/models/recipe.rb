class Recipe < ApplicationRecord
  has_snowflake_id('rec')
  acts_as_paranoid

  belongs_to :mixture

  def organization
    mixture&.organization
  end
end
