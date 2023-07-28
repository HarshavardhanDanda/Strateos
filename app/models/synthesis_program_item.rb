class SynthesisProgramItem < ApplicationRecord
  has_snowflake_id('spi')
  acts_as_paranoid
  audited associated_with: :synthesis_program

  belongs_to :synthesis_program
  belongs_to :item, :polymorphic => true

  # The has_one associations is to assign the polymorphic item field as belongs_to to the following models. This is
  # important to add errors and perform validations related to the models that this model belongs to using the item_type
  # The :self_ref assignment is a trick to get that done
  # https://stackoverflow.com/questions/21850995/association-for-polymorphic-belongs-to-of-a-particular-type
  has_one :self_ref, :class_name => self.to_s, :foreign_key => :id
  has_one :library, :through => :self_ref, :source => :item, :source_type => Library
  has_one :batch, :through => :self_ref, :source => :item, :source_type => Batch
  has_one :return_shipment, :through => :self_ref, :source => :item, :source_type => ReturnShipment


  validates :item_id, presence: true
  validates :item_type, presence: true, inclusion: { in: [ Batch.to_s, Library.to_s, ReturnShipment.to_s ] }
  validates :synthesis_program, presence: true
  validate :item_existence
  validate :organization_match
  validate :item_uniqueness

  def item_existence
    item = self.item_type.constantize.find_by_id(self.item_id)
    if item.nil?
      errors.add(self.item_type.underscore.to_sym, :not_found)
    end
  end

  def organization_match
    if self.synthesis_program.organization != self.item&.organization
      errors.add(self.item_type.underscore.to_sym, :organization_mismatch, value: self.item_id)
    end
  end

  def item_uniqueness
    synthesis_program_item = SynthesisProgramItem.find_by_item_id(self.item_id)
    unless synthesis_program_item.nil?
      errors.add(self.item_type.underscore.to_sym, :taken, value: self.item_id)
    end
  end
end
