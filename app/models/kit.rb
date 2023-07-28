class Kit < ApplicationRecord
  has_snowflake_id('kit')
  acts_as_paranoid
  searchkick(
    callbacks: :async,
    word_middle: [ :name, :sku ],
    word_start: [ :id, :resource_names, :resource_ids ]
  )

  INDIVIDUAL_TYPE = 'individual'
  GROUP_TYPE = 'group'

  belongs_to :vendor
  belongs_to :supplier
  belongs_to :organization
  has_many :kit_items, -> { order(id: :ASC) }, dependent: :destroy
  has_many :kit_items_with_deleted, -> { with_deleted }, class_name: "KitItem", dependent: :destroy
  has_many :resources, :through => :kit_items
  has_many :kit_orders
  has_and_belongs_to_many :categories

  validates :name, presence: true
  validates :cost, presence: true, numericality: true
  validates :kit_type, acceptance: { accept: [ GROUP_TYPE, INDIVIDUAL_TYPE ] }
  accepts_nested_attributes_for :kit_items, allow_destroy: true

  scope :grouped_individual_materials, lambda {
    where(kit_type: INDIVIDUAL_TYPE)
      .joins(:kit_items)
      .group('kit_items.resource_id, vendor_id, supplier_id')
      .select('array_agg (kits.id ORDER BY kits.created_at, kits.id) as kit_ids')
  }

  scope :filter_by_provisionable, lambda { |value|
    joins(:kit_items).where(kit_items: { provisionable: value }).distinct
  }

  scope :by_category_id, lambda { |category_id|
    joins("inner join categories_kits on kits.id = categories_kits.kit_id")
      .where("categories_kits.category_id = ?", category_id)
  }

  scope :filter_by_supplier, lambda { |value|
    joins("inner join suppliers on kits.supplier_id = suppliers.id")
      .where(suppliers: { name: value }).distinct
  }

  scope :cost_bounds, lambda { |min_bound, max_bound|
    if min_bound && max_bound
      where("cost between ? and ?", min_bound, max_bound)
    elsif min_bound
      where("cost >= ?", min_bound)
    elsif max_bound
      where("cost <= ?", max_bound)
    end
  }

  scope :by_compound_id, lambda { |compound_id|
    joins(:kit_items => :resource)
      .where("resources.compound_id = ?", compound_id)
  }

  VENDOR_JSON = {
    only: [ :id, :name ],
    include: [],
    methods: []
  }

  SUPPLIER_JSON = {
    only: [ :id, :name ],
    include: [],
    methods: []
  }

  def self.kits_to_reorder
    applicable_containers =
      Container.joins(:aliquots, :kit_item)
               .where(organization_id: nil,
                      test_mode: false)
               .where("expires_at is null OR expires_at > ?", Time.now)
               .where.not(kit_items: { reorder_point: nil })
               .group(:kit_item_id)

    counts = applicable_containers.size
    volumes = applicable_containers.sum('aliquots.volume_ul')
    masses = applicable_containers.sum('aliquots.mass_mg')

    reorderable_kit_items =
      KitItem.includes(:kit)
             .where.not(reorder_point: nil)
             .where.not(kit_id: KitOrder.select(:kit_id).where(checked_in_at: nil))
             .where(kits: { depleted_at: nil })

    kit_items_to_reorder = reorderable_kit_items.select do |ki|
      # Select kit items with reorder points that either have no stock,
      # or have stock below reorder point
      kit_item_id = ki[:id]
      count       = counts[kit_item_id]
      volume      = volumes[kit_item_id]
      mass        = masses[kit_item_id]

      if count == 0 || count.nil? || ((volume == 0 || volume.nil?) && (mass == 0 || mass.nil?))
        true
      elsif ki.reservable
        count <= ki.reorder_point
      elsif volume == 0 || volume.nil?
        mass <= ki.reorder_point
      else
        volume <= ki.reorder_point
      end
    end

    kit_items_to_reorder.map(&:kit)
  end

  def self.container_attrs(containers, kit_items, kit_order = nil)
    kit_item_ids = kit_items.map(&:id)

    containers.map do |cparams|
      cparams.require(:location_id)

      container_type = ContainerType.find(cparams.require(:container_type))
      kit_item_id    = cparams.require(:kit_item_id)

      if not kit_item_ids.include? kit_item_id
        raise ActionController::ParameterMissing("Invalid kit_item_id: #{kit_item_id}")
      end

      c_attrs = cparams.permit(:label, :barcode, :location_id, :expires_at,
                               :storage_condition, :kit_item_id).to_h
      c_attrs[:container_type] = container_type
      c_attrs[:kit_order_id]   = kit_order&.id

      aliquot_count      = container_type.well_count
      total_volume       = BigDecimal(cparams.require('volume'))
      volume_per_aliquot = total_volume / aliquot_count

      resource_id = kit_items.find { |ki| ki.id == kit_item_id }.resource_id
      a_attrs = (0...aliquot_count).map { |well_idx|
        [ well_idx, {
          volume_ul: volume_per_aliquot,
          lot_no: cparams[:lot_no],
          resource_id: resource_id
        } ]
      }.to_h

      [ c_attrs, a_attrs ]
    end
  end

  def total_ordered
    total_count = 0
    kit_orders.each do |kit_order|
      total_count += kit_order.count
    end
    sister_materials&.each do |sister_material|
      sister_kit_orders = sister_material.kit_orders
      sister_kit_orders.each do |kit_order|
        total_count += kit_order.count
      end
    end
    return total_count
  end

  def self.full_json
    {
      only: [ :id, :name, :sku, :url, :is_private, :created_at, :note, :kit_type, :cost, :tier ],
      methods: [ :sale_price ],
      include: {
        vendor: VENDOR_JSON,
        supplier: SUPPLIER_JSON,
        kit_items: KitItem.full_json,
        categories: {
          only: [ :id, :path ],
          include: [],
          methods: []
        }
      }
    }
  end

  def self.admin_full_json
    Kit.full_json.merge({
      only: Kit.full_json[:only] + [ :cost, :profit_margin, :depleted_at ],
      methods: Kit.full_json[:methods] + [ :total_ordered ]
    })
  end

  def self.short_json
    {
      only: [ :id, :name, :sku, :cost, :url, :is_private, :note, :created_at, :kit_type, :tier ],
      methods: [ :sale_price ],
      include: {
        vendor: VENDOR_JSON,
        supplier: SUPPLIER_JSON,
        kit_items: {
          only: [ :id ],
          methods: [],
          include: []
        },
        categories: {
          only: [ :id, :path ],
          include: [],
          methods: []
        }
      }
    }
  end

  def vendor_name
    vendor.try(:name)
  end

  def supplier_name
    supplier.try(:name)
  end

  def self.admin_short_json
    Kit.short_json.merge({
      only: Kit.short_json[:only] + [ :profit_margin, :depleted_at ],
      methods: [ :total_ordered, :reorder ]
    })
  end

  def profit_margin
    super || 0.10
  end

  def can_be_seen_by?(_user)
    !is_private
  end

  def sale_price
    cost * (PricingManager::SALES_TAX_MULTIPLIER + profit_margin)
  end

  def uniq_resources
    kit_items.map(&:resource_id).uniq
  end

  def should_index?
    deleted_at.nil?
  end

  def search_data
    # list of category paths: [a, a/b, a/b/c, ...]
    category_paths = categories.map { |category|
      Array.new(category.path.size) do |i|
        category.path[0..i].join("/")
      end
    }.flatten

    items = kit_items.to_a

    {
      id: id,
      categories: category_paths,
      resource_ids: items.map { |ki| ki.resource.try(:id) },
      resource_names: items.map { |ki| ki.resource.try(:name) },
      created_at: created_at,
      name: name,
      is_private: is_private,
      sku: sku,
      vendor_name: vendor.try(:name),
      vendor_id: vendor.try(:id),
      kit_type: kit_type,
      supplier_name: supplier_name,
      supplier_id: supplier.try(:id),
      total_ordered: total_ordered,
      reorder: reorder,
      organization_id: organization_id
    }
  end

  def serializable_hash(opts = {})
    opts = Kit.full_json.merge(opts || {})
    super(opts)
  end

  def category=(category_name)
    path = category_name.split('/')
    category = (Category.for_path(path) or Category.create!(path: path))
    self.categories = [ category ]
  end

  def reorder
    if !depleted_at.nil?
      return false
    end

    applicable_containers =
      Container.joins(:aliquots, :kit_item)
               .where(kit_item_id: kit_items.map(&:id))
               .where(organization_id: nil,
                      test_mode: false)
               .where("expires_at is null OR expires_at > ?", Time.now)
               .where.not(kit_items: { reorder_point: nil })
               .group(:kit_item_id)

    counts = applicable_containers.size
    volumes = applicable_containers.sum('aliquots.volume_ul')
    masses = applicable_containers.sum('aliquots.mass_mg')

    reorderable_kit_items =
      KitItem.where(id: kit_items.map(&:id))
             .where.not(reorder_point: nil)
             .where.not(kit_id: KitOrder.select(:kit_id).where(checked_in_at: nil))

    reorderable_kit_items.each do |ki|
      # Select kit items with reorder points that either have no stock,
      # or have stock below reorder point
      kit_item_id = ki[:id]
      count       = counts[kit_item_id]
      volume      = volumes[kit_item_id]
      mass        = masses[kit_item_id]

      reorder = if count == 0 || count.nil? || ((volume == 0 || volume.nil?) && (mass == 0 || mass.nil?))
                  true
                elsif ki.reservable
                  count <= ki.reorder_point
                elsif volume == 0 || volume.nil?
                  mass <= ki.reorder_point
                else
                  volume <= ki.reorder_point
                end

      if reorder
        return true
      end
    end

    return false
  end

  def sister_materials
    if kit_type == Kit::INDIVIDUAL_TYPE
      Kit.joins(:kit_items)
         .where.not(id: id)
         .where(kit_type: Kit::INDIVIDUAL_TYPE, organization_id: organization&.id,
                vendor_id: vendor&.id, supplier_id: supplier&.id)
         .where('kit_items.resource_id IN (?)', kit_items.pluck(:resource_id))
         .sort_by(&:created_at)
    else
      []
    end
  end
end
