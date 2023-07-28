class IdtSequence < ApplicationRecord
  belongs_to :idt_order
  belongs_to :instruction
  has_one :run, through: :instruction

  ORDER_TYPES     = [ 'oligo', 'gblock' ]
  FORMAT          = [ 'tube', 'plate' ]
  PURIFFICIATIONS = [ 'standard', 'hplc', 'page' ]
  SCALES          = [ '10nm', '25nm', '100nm', '250nm', '1um' ]

  validates :order_type, inclusion: {
    in: ORDER_TYPES,
    message: "%{value} is not a valid IDT sequence type (#{ORDER_TYPES})"
  }

  validates :purification, inclusion: {
    in: PURIFFICIATIONS,
    message: "%{value} is not a valid IDT sequence purification (#{PURIFFICIATIONS})"
  }

  validates :scale, inclusion: {
    in: SCALES,
    message: "%{value} is not a valid IDT sequence scale (#{SCALES})"
  }

  def gblock?
    order_type == 'gblock'
  end

  def oligo?
    order_type == 'oligo'
  end

  def plate?
    format == 'plate'
  end

  def tube?
    format == 'tube'
  end
end
