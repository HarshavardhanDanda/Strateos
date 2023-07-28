class OrderableMaterial < ApplicationRecord
  has_snowflake_id('omat')
  acts_as_paranoid

  belongs_to :material

  has_many :orderable_material_components, dependent: :destroy
  has_many :material_components, :through => :orderable_material_components
  has_many :kit_orders
  has_many :kit_requests

  validates :material, presence: true
  validates :price, numericality: { greater_than: 0 }

  def self.flat_json
    { only: self.column_names, include: {}}
  end

  def is_private
    self.material.is_private
  end

  def organization
    self.material.organization
  end

  def self.full_json
    {
      only: self.column_names,
      include: {
        material: Material.full_json
      }
    }
  end

  # find orderable_material satisfying order_params attributes, else create
  # also create material and material_component if doesn't exists
  def self.find_or_create_individual_orderable_material(order_params, pundit_user)
    supplier_name, sku, lab_id, compound_id = order_params.values_at(:supplier_name, :sku, :lab_id, :compound_id)

    vendor = Vendor.find_or_create_by!(name: 'eMolecules', organization_id: pundit_user.organization.id)
    supplier = Supplier.find_or_create_by!(name: supplier_name, organization_id: pundit_user.organization.id)
    lab = Lab.find(lab_id)
    operated_by_id = lab.operated_by_id

    materials = Material
                .by_compound_id(compound_id)
                .where(vendor_id: vendor.id, supplier_id: supplier.id, organization_id: operated_by_id)

    if materials.empty?
      materials = Material
                  .by_compound_id(compound_id)
                  .where(vendor_id: vendor.id, supplier_id: supplier.id, organization_id: operated_by_id)
                  .where('resources.purity is NULL')
      resource = if materials.empty?
                   Resource.where(compound_id: compound_id, purity: nil).first
                 else
                   materials.first.resources.first
                 end

      resource ||= Resource.create!(kind: 'ChemicalStructure', compound_id: compound_id, name: 'placeholder',
                                    organization_id: pundit_user.organization.id)

      material = Material.create!(vendor_id: vendor.id, supplier_id: supplier.id, name: supplier.name,
                                  material_type: Material::MATERIAL_TYPE[:individual], is_private: false,
                                  organization_id: operated_by_id)
      material_component = MaterialComponent.create!(material_id: material.id, resource_id: resource.id)

      orderable_material = create_orderable_material(order_params
                                                       .merge(material_id: material.id)
                                                       .merge(material_component_id: material_component.id))
    else
      orderable_materials = OrderableMaterial
                            .where(material_id: materials.first.id, sku: sku)
      orderable_material = if orderable_materials.empty?
                             create_orderable_material(order_params
                                                         .merge(material_id: materials.first.id)
                                                         .merge(material_component_id:
                                                                  materials.first.material_components.first.id))
                           else
                             orderable_materials.first
                           end
    end
    orderable_material
  end

  def self.create_orderable_material(order_params)
    material_id, price, sku, tier, volume_units, mass_units, mass_per_container, volume_per_container, no_of_units,
      material_component_id, provisionable, dispensable, indivisible, reservable =
      order_params.values_at(:material_id, :price, :sku, :tier, :volume_units, :mass_units, :mass_per_container,
                             :volume_per_container, :no_of_units, :material_component_id,
                             :provisionable, :dispensable, :indivisible, :reservable)

    orderable_material = OrderableMaterial.create!(material_id: material_id, price: price, sku: sku, tier: tier)

    orderable_material_component = OrderableMaterialComponent.new(
      orderable_material_id: orderable_material.id, material_component_id: material_component_id,
      no_of_units: no_of_units || 1, indivisible: indivisible, provisionable: provisionable,
      dispensable: dispensable, reservable: reservable, container_type_id: 'vendor-tube'
    )

    if volume_units.present?
      orderable_material_component.volume_per_container = volume_per_container
      orderable_material_component.vol_measurement_unit = volume_units
    end

    if mass_units.present?
      orderable_material_component.mass_per_container = mass_per_container
      orderable_material_component.mass_measurement_unit = mass_units
    end

    orderable_material_component.save!
    orderable_material
  end

  # using material_components instead of orderable_material_components
  def uniq_resources
    material_components.map(&:resource_id).uniq
  end

  def sale_price
    PricingManager.sale_price_for_orderable_material(self)
                  .round(PricingManager::CHARGE_DECIMAL_PLACES)
  end

end
