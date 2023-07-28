class IdtOrder < ApplicationRecord
  has_many :idt_sequences
  belongs_to :lab

  scope :outstanding, -> { where(order_placed_at: nil) }

  def gblock_tubes
    idt_sequences.select(&:gblock?)
  end

  def oligo_tubes
    idt_sequences.select { |sequence| sequence.oligo? && sequence.tube? }
  end

  def oligo_plates
    idt_sequences.select { |sequence| sequence.oligo? && sequence.plate? }
                 .group_by(&:container_name)
                 .map { |name, sequences| [ name, sequences.sort_by(&:container_well) ] }
  end

  def self.flat_json
    {
      only: self.column_names, include: {
        lab: {
          only: [ :id, :name ]
        }
      },
      methods: []
    }
  end
end
