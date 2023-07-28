class AliquotEffect < ApplicationRecord
  has_snowflake_id('ae')

  belongs_to :generating_instruction, class_name: 'Instruction'
  belongs_to :affected_container, -> { with_deleted }, class_name: 'Container'

  validates_presence_of :affected_container
  validates_presence_of :effect_type

  # effect_types:
  # liquid_transfer_in:
  #  {
  #    "source": {
  #      "container_id": "ct1xxx",
  #      "well_idx": 0,
  #      "at_effect_id": "ae1xxxx"
  #    },
  #    "volume_ul": 20
  #  }
  #
  # liquid_transfer_out:
  #  {
  #    "destination": {
  #      "container_id": "ct1xxx",
  #      "well_idx": 0
  #    },
  #    "volume_ul": 20
  #  }
  #
  # instruction:
  #  null
  #  (just look at the generating_instruction)

  def self.full_json
    {
      only: [ :id, :sequence_no, :effect_type, :effect_data,
             :affected_container_id, :affected_well_idx, :created_at ],
      methods: [],
      include: {
        generating_instruction: {
          only: [ :sequence_no, :operation ],
          include: {
            run: Run.mini_json
          }
        }
      }
    }
  end

  def serializable_hash(opts = {})
    opts = AliquotEffect.full_json.merge(opts || {})
    super(opts)
  end
end
