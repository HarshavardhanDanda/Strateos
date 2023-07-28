class KitItem < ApplicationRecord
  has_snowflake_id('ki')
  acts_as_paranoid

  belongs_to :kit, -> { with_deleted }, class_name: 'Kit'
  belongs_to :resource
  belongs_to :container_type
  has_many :containers

  validates :resource, presence: true
  validates :volume_ul, presence: true, numericality: true
  validates :mass_mg, numericality: true, allow_nil: true
  validates :container_type, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :reorder_point, numericality: true, allow_nil: true
  validates :maximum_stock, numericality: true, allow_nil: true

  scope :filter_by_resource_supplier_vendor, lambda { |resource_id, supplier_id, vendor_id|
    where(resource_id: resource_id)
      .joins(:kit)
      .where(kits: { vendor_id: vendor_id, supplier_id: supplier_id })
  }

  def self.full_json
    {
      only: [
        :id, :concentration, :container_type_id,
        :dispensable, :provisionable, :reservable, :indivisible,
        :resource_id, :volume_ul, :mass_mg, :amount, :kit_id
      ],
      methods: [],
      include: {
        container_type: {
          only: [ :id, :name, :shortname ]
        },
        resource: {
          only: [ :id, :name, :storage_condition, :kind, :sensitivities, :purity ],
          include: {
            compound: {
              only: [ :id, :smiles, :molecular_weight ],
              include: {
                compound_links: {
                  only: [ :id, :name, :reference_id, :organization_id ]
                }
              }
            }
          },
          methods: []
        }
      }
    }
  end

  def self.admin_full_json
    KitItem.full_json.merge({
      only: KitItem.full_json[:only] + [ :reorder_point, :maximum_stock ]
    })
  end
end
