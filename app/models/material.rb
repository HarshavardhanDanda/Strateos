class Material < ApplicationRecord
  has_snowflake_id('mat')
  acts_as_paranoid
  audit_trail

  MATERIAL_TYPE = { individual: 'individual', group: 'group' }.freeze

  belongs_to :vendor
  belongs_to :supplier
  belongs_to :organization

  has_many :material_components, dependent: :destroy
  has_many :resources, :through => :material_components
  has_many :orderable_materials, dependent: :destroy

  has_many :category_materials
  has_many :categories, :through => :category_materials

  validates :organization, presence: true
  validates :name, presence: true
  validates :material_type, presence: true,
            inclusion: { in: MATERIAL_TYPE.values,
                         message: "%{value} is not a valid material type (#{MATERIAL_TYPE.values})" }
  validates :is_private, inclusion: { in: [ true, false ] }

  scope :by_compound_id, lambda { |compound_id|
    joins(:material_components => :resource)
      .where("resources.compound_id = ?", compound_id)
  }

  scope :by_category_id, lambda { |category_id|
    joins("inner join categories_materials on materials.id = categories_materials.material_id")
      .where("categories_materials.category_id= ?", category_id)
  }

  scope :filter_by_provisionable, lambda { |value|
    joins("INNER JOIN material_components ON
            materials.id = material_components.material_id
              INNER JOIN orderable_material_components ON
                orderable_material_components.material_component_id = material_components.id")
      .where("orderable_material_components.provisionable = ?", value).distinct
  }

  scope :filter_by_supplier, lambda { |value|
    joins("inner join suppliers on materials.supplier_id = suppliers.id")
      .where(suppliers: { name: value })
  }

  def total_ordered
    amount_ordered = 0
    orderable_materials.each do |om|
      om.kit_orders.each do |order|
        amount_ordered += order.count
      end
    end
    amount_ordered
  end

  def self.full_json
    {
      only: self.column_names,
      include: {
        vendor: Vendor.flat_json,
        supplier: Supplier.flat_json,
        material_components: MaterialComponent.full_json
      }
    }
  end

  def self.short_json
    {
      only: [ :id, :name, :url, :is_private, :note, :created_at, :material_type ],
      methods: [],
      include: {
        vendor: Vendor.flat_json,
        supplier: Supplier.flat_json,
        orderable_materials: {
          only: [ :id, :sku, :price, :tier ],
          methods: [ :sale_price ],
          include: {
            orderable_material_components: {
              only: [ :id ],
              methods: [],
              include: []
            }
          }
        },
        categories: {
          only: [ :id, :path ],
          include: [],
          methods: []
        }
      }
    }
  end

end
