class KitOrder < ApplicationRecord
  has_snowflake_id('ko')

  searchkick(
    callbacks: :async,
    word_start: [ :id, :name, :vendor_order_id ]
  )

  belongs_to :kit
  belongs_to :lab
  belongs_to :user

  belongs_to :orderable_material

  # TODO: Replicates enum logic where the value is
  # stored as a string. Use an enum library.
  validates_inclusion_of :state, in: [ 'PENDING', 'PURCHASED', 'SHIPPED', 'ARRIVED', 'CHECKEDIN' ]
  validates :count, numericality: { greater_than: 0 }

  def receive!
    self.update!(received_at: Time.now)
  end

  def self.full_json
    {
      only: [ :id, :created_at, :checked_in_at, :updated_at, :count, :note, :received_at, :state, :tracking_code,
              :lab_id, :user_id, :vendor_order_id ],
      include: {
        lab: Lab.flat_json,
        orderable_material: {
          only: [ :id, :sku ],
          include: {
            material: Material.full_json,
            orderable_material_components: OrderableMaterialComponent.full_json
          }
        },
        user: {
          only: [ :id, :first_name, :last_name ],
          include: {},
          methods: [ :profile_img_url, :name ]
        }
      }
    }
  end

  def self.flat_json
    { only: self.column_names, include: {}}
  end

  def compound_ids
    compound_ids = []
    orderable_material&.orderable_material_components&.each do |omc|
      compound_ids << omc.resource.compound_id unless omc.resource.compound_id.nil?
    end

    compound_ids
  end

  def search_data
    resource_names = []
    resource_ids = []
    orderable_material&.orderable_material_components&.each do |omc|
      resource_names << omc.resource.name
      resource_ids << omc.resource.id
    end
    vendor_name = orderable_material&.material&.vendor&.name
    supplier_name = orderable_material&.material&.supplier&.name

    searchkick_as_json(KitOrder.flat_json)
      .merge(
        name: orderable_material&.material&.name,
        vendor: orderable_material&.material&.vendor&.id,
        supplier_name: supplier_name,
        vendor_name: vendor_name,
        location: lab&.name,
        user_name: user&.name,
        material_type: orderable_material&.material&.material_type,
        sku: orderable_material&.sku,
        resource_names: resource_names,
        resource_ids: resource_ids,
        compound_ids: compound_ids
      )
  end

  def checkedin_containers
    Container.where(kit_order: self)
  end

  def serializable_hash(opts = {})
    opts = KitOrder.full_json.merge(opts || {})
    super(opts)
  end

end
