class MixtureComponent < ApplicationRecord
  MIXABLE_TYPES = [ 'Resource', 'Mixture' ].freeze

  has_snowflake_id('mixc')
  acts_as_paranoid

  belongs_to :mixture
  belongs_to :mixable, :polymorphic => true
  belongs_to :vendor
  belongs_to :supplier

  has_one :self_ref, :class_name => 'MixtureComponent', :foreign_key => :id
  has_one :mixable_resource, :through => :self_ref, :source => :mixable, :source_type => 'Resource'
  has_one :mixable_mixture, :through => :self_ref, :source => :mixable, :source_type => 'Mixture'


  attribute :starting_concentration, Concentration::ConcentrationType.new
  attribute :target_concentration, Concentration::ConcentrationType.new

  validates :mixture, presence: true
  validates :mixable_id, presence: true
  validates :mixable_type, presence: true, inclusion: { in: MIXABLE_TYPES }
  validates :starting_concentration, concentration: true
  validates :target_concentration, concentration: true

  def organization
    mixture&.organization
  end
end
