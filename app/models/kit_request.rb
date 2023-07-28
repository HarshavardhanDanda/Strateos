class KitRequest < ApplicationRecord
  has_snowflake_id('kr')
  belongs_to :kit
  belongs_to :orderable_material
  belongs_to :organization
  belongs_to :user
  has_many   :containers
  belongs_to :run

  def self.full_json
    {
      only: [ :id, :created_at, :fulfilled_at, :quantity, :user_id, :run_id ],
      methods: [],
      include: {
        containers: Container.short_json,
        orderable_material: OrderableMaterial.short_json,
        organization: Organization::SHORT_JSON
      }
    }
  end

  def inbound_containers
    containers.where(status: "inbound")
  end

  def self.unfulfilled
    KitRequest.where(fulfilled_at: nil)
              .order('created_at ASC')
  end

  def self.unfulfilled_by_orderable_material(orderable_material)
    KitRequest.where(fulfilled_at: nil, orderable_material: orderable_material)
              .order('created_at ASC')
  end

  def serializable_hash(opts = {})
    opts = KitRequest.full_json.merge(opts || {})
    super(opts.deep_dup)
  end
end
