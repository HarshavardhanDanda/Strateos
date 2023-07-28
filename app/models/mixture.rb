class Mixture < ApplicationRecord
  has_snowflake_id('mix')
  acts_as_paranoid

  belongs_to :organization
  belongs_to :created_by, class_name: 'User'
  has_many :mixture_components, dependent: :destroy
  has_many :mixture_components_as_mixable, as: :mixable, class_name: 'MixtureComponent'
  has_many :resources, :through => :mixture_components, :source => :mixable, :source_type => 'Resource'
  has_many :mixtures, :through => :mixture_components, :source => :mixable, :source_type => 'Mixture'
  has_many :recipes

  accepts_nested_attributes_for :mixture_components

  validates :label, presence: true
  validates :description, presence: true
  validates :created_by, presence: true
  validates_associated :mixture_components
end
