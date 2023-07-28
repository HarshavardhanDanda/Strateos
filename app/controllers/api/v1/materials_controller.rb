module Api
  module V1
    class MaterialsController < Api::ApiController

      BULK_CREATE_MATERIAL_SCHEMA_JSON = File.read(Rails.root.join('app/models/schemas/material_bulk_creation.json'))
      BULK_CREATE_MATERIAL_SCHEMA = JSON.parse(BULK_CREATE_MATERIAL_SCHEMA_JSON)

      UPDATE_MATERIAL_SCHEMA_JSON = File.read(Rails.root.join('app/models/schemas/material_update.json'))
      UPDATE_MATERIAL_SCHEMA = JSON.parse(UPDATE_MATERIAL_SCHEMA_JSON)

      def bulk_create_with_dependencies
        validate_json(BULK_CREATE_MATERIAL_SCHEMA, params.to_unsafe_hash)
        authorize(Material.new, :create?)
        materials_payload = params.require(:data)
        include_param = params[:include] || []
        ActiveRecord::Base.transaction do
          materials = materials_payload.map do |payload|
            params = payload.permit(:material_type, :name, :url, :is_private, :vendor_id, :supplier_id, :note,
                                    :category_ids => [])
            material = Material.create!(**params, organization: @organization)

            if material.material_type == "individual"
              orderable_materials_payload = payload.require(:orderable_materials)
              create_individual_orderable_material_dependencies(material, orderable_materials_payload)
            elsif material.material_type == "group"
              orderable_material_payload = payload.require(:orderable_materials)[0]
              orderable_material = create_orderable_material(material, orderable_material_payload)
              omcs_payload = orderable_material_payload.require(:orderable_material_components)
              create_group_orderable_material_dependencies(material, orderable_material, omcs_payload)
            end

            material
          end
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::MaterialResource, include: include_param)
          resources = materials.map { |m| Api::V1::MaterialResource.new(m, context) }
          json = serializer.serialize_to_hash(resources)
          render json: json, status: :ok
        end
      end

      def update_with_dependencies
        validate_json(UPDATE_MATERIAL_SCHEMA, params.to_unsafe_hash)
        payload = params.require(:data)
        include_param = params[:include] || []
        material = Material.find(payload.require(:id))
        authorize(material, :update?)
        params = if material.material_type == "individual"
                   payload.permit(:name, :url, :is_private, :note, :category_ids => [])
                 else
                   payload.permit(:supplier_id, :vendor_id, :name, :url, :is_private, :note, :category_ids => [])
                 end
        ActiveRecord::Base.transaction do
          material.update!(params)
          orderable_materials_payload = payload.require(:orderable_materials)
          if material.material_type == "individual"
            update_individual_material_dependencies(material, orderable_materials_payload)
          else
            update_group_material_dependencies(material, orderable_materials_payload)
          end
        end
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::MaterialResource, include: include_param)
        resource = Api::V1::MaterialResource.new(material, context)
        json = serializer.serialize_to_hash(resource)
        render json: json, status: :ok
      end

      def material_stats
        material = Material.find(params[:id])
        ko_count = material.orderable_materials.joins(:kit_orders).count
        ct_count = material.orderable_materials
                           .joins(orderable_material_components: :containers).count

        render json: { kit_orders_count: ko_count, containers_count: ct_count }, status: :ok
      end

      private

      def create_individual_orderable_material_dependencies(material, orderable_materials_payload)
        material_component_payload =
          orderable_materials_payload[0][:orderable_material_components][0][:material_component]

        material_component_concentration =
          orderable_materials_payload[0][:orderable_material_components][0][:material_component_concentration]

        if !material_component_concentration.nil?
          material_component_payload[:concentration] = material_component_concentration
        end

        material_component = create_material_component(material, material_component_payload)
        orderable_materials_payload.each do |om_payload|
          orderable_material = create_orderable_material(material, om_payload)
          omc_payload = om_payload[:orderable_material_components][0]
          create_orderable_material_component(orderable_material, material_component, omc_payload)
        end
      end

      def create_group_orderable_material_dependencies(material, orderable_material, payload)
        payload.each do |omc_payload|
          material_component_payload = omc_payload.require(:material_component)
          material_component_concentration = omc_payload[:material_component_concentration]

          if !material_component_concentration.nil?
            material_component_payload[:concentration] = material_component_concentration
          end
          material_component = create_material_component(material, material_component_payload)
          create_orderable_material_component(orderable_material, material_component, omc_payload)
        end
      end

      def create_material_component(material, payload)
        resource = Resource.find(payload[:resource_id])
        concentration = payload[:concentration]
        MaterialComponent.find_or_create_by!(resource: resource, material: material, concentration: concentration)
      end

      def create_orderable_material(material, orderable_material)
        params = orderable_material.permit(:price, :margin, :sku, :tier)
        material.orderable_materials.create!(params)
      end

      def create_orderable_material_component(orderable_material, material_component, omc)
        params = omc.permit(
          :name,
          :container_type_id,
          :no_of_units,
          :volume_per_container,
          :mass_per_container,
          :vol_measurement_unit,
          :mass_measurement_unit,
          :provisionable,
          :reservable,
          :indivisible,
          :dispensable
        )
        orderable_material.orderable_material_components.create!(**params, material_component: material_component)
      end

      def update_individual_material_dependencies(material, orderable_materials_payload)
        # Delete oms
        OrderableMaterial.destroy(material.orderable_materials.pluck(:id) -
                                    orderable_materials_payload.map { |om| om["id"] })
        # Update oms
        to_update = orderable_materials_payload.select { |om| om[:id] }
        to_update.each do |om_payload|
          update_orderable_material(om_payload)
          omc_payload = om_payload.require(:orderable_material_components)[0]

          # update mc
          update_material_component(omc_payload)

          # Update omc
          update_orderable_material_component(omc_payload)
        end
        # Create oms
        to_create = orderable_materials_payload.select { |om| !om[:id] }
        if to_create.present?
          create_individual_orderable_material_dependencies(material, to_create)
        end
      end

      def update_group_material_dependencies(material, orderable_materials_payload)
        orderable_material = update_orderable_material(orderable_materials_payload[0])
        omcs_payload = orderable_materials_payload[0][:orderable_material_components]
        # Delete omcs
        OrderableMaterialComponent.destroy(orderable_material.orderable_material_components.pluck(:id) -
                                             omcs_payload.map { |omc| omc["id"] })
        # Update omcs
        to_update = omcs_payload.select { |omc| omc[:id] }
        to_update.each do |omc_payload|
          update_orderable_material_component(omc_payload)
          # update mc
          update_material_component(omc_payload)
        end
        # Create omcs
        to_create = omcs_payload.select { |omc| !omc[:id] }
        if to_create.present?
          create_group_orderable_material_dependencies(material, orderable_material, to_create)
        end
      end

      def update_orderable_material(payload)
        orderable_material = OrderableMaterial.find(payload.require(:id))
        params = payload.permit(:price, :margin, :sku, :tier)
        orderable_material.update!(params)
        orderable_material
      end

      def update_material_component(payload)
        material_component_concentration = payload[:material_component_concentration]
        material_component_id = payload[:material_component_id]
        if !material_component_concentration.nil? && !material_component_id.nil?
          material_component = MaterialComponent.find(material_component_id)
          material_component.update!(concentration: material_component_concentration)
        end
      end

      def update_orderable_material_component(payload)
        orderable_material_component = OrderableMaterialComponent.find(payload.require(:id))
        params = payload.permit(
          :name,
          :no_of_units,
          :volume_per_container,
          :mass_per_container,
          :vol_measurement_unit,
          :mass_measurement_unit,
          :provisionable,
          :reservable,
          :indivisible,
          :dispensable,
          :container_type_id
        )
        orderable_material_component.update!(params)
        orderable_material_component
      end
    end
  end
end
