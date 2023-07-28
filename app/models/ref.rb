class Ref < ApplicationRecord
  belongs_to :run
  has_many :instructions_refs, class_name: :InstructionRef, dependent: :destroy
  has_many :instructions, through: :instructions_refs
  belongs_to :run_without_large_columns, lambda {
    without_large_columns
  }, class_name: 'Run', foreign_key: 'run_id'

  belongs_to :container, -> { with_deleted }
  belongs_to :reserve_kit_item, class_name: 'KitItem'
  belongs_to :orderable_material_component

  # a realized ref is a ref that has been executed upon by atleast one instruction
  scope :realized, lambda {
    joins(:instructions).where.not(instructions: { completed_at: nil })
  }

  # an unrealized ref is a ref that has NOT been executed upon by ANY instruction
  scope :unrealized, lambda {
    where.not(id: realized)
  }

  def self.full_json
    {
      only: [ :name, :container_id, :new_container_type, :destiny ],
      methods: [ :container_type ],
      include: {
        container: Container.short_json,
        orderable_material_component: {
          only: [ :id ],
          include: {
            resource: {
              only: [ :id, :name ],
              include: {},
              methods: []
            }
          },
          methods: []
        }
      }
    }
  end

  def self.short_json
    {
      only: [ :id, :container_id ]
    }
  end

  def container_type
    if is_new?
      ContainerType.find(new_container_type)
    elsif is_reserve?
      orderable_material_component.container_type
    elsif container
      container.container_type
    else
      nil # container does not exist, probably from aborted run (ref remains but container never was created)
    end
  end

  # Once an instruction executes upon a ref, we want to update the ref's container's
  # storage_condition to the destiny storage.
  def start
    if destiny && destiny['store']
      storage_condition = destiny['store']['where']
      container.update!(storage_condition: storage_condition)
    end
  end

  def is_new?
    !new_container_type.blank?
  end

  def is_reserve?
    !orderable_material_component.blank?
  end

  def storage_condition
    return nil if self.destiny['discard']

    store = self.destiny['store']
    if store.nil?
      'ambient'
    else
      store['where']
    end
  end

  # Can reserve destiny if specify where location that isn't `in_system`
  def can_reserve_destiny
    where = self.destiny.dig('store', 'where')

    where && (where != 'in_system' && where != 'quarantine')
  end

  # helper function to parse a 'ref name / well' string to a refname, well tuple
  def self.parse_ref_string(ref_string)
    # splits on the last forward slash in the string
    name, well = ref_string.split(%r{/(?=[^/]+$)})
    [ name, well ]
  end
end
