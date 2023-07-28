module Api
  module V1
    class KitOrdersController < Api::ApiController
      def create
        params.require([ :lab_id, :orderable_material_id ])
        kit_order = create_kit_order(params)

        if kit_order.save
          SlackMessageForKitOrderJob.perform_async(kit_order.id)
          render json: kit_order, status: :created
        else
          render json: kit_order.errors, status: :unprocessable_entity
        end
      end

      KIT_ORDER_BULK_CHECKIN_SCHEMA = JSON.parse(
        File.read(
          Rails.root.join(
            'app/models/schemas/bulk_checkin_kit_orders.json'
          )
        )
      )

      KIT_ORDER_MATERIAL_CHECKIN_SCHEMA = JSON.parse(
        File.read(
          Rails.root.join(
            'app/models/schemas/material_checkin_kit_order.json'
          )
        )
      )

      BULK_CREATE_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "kit_orders": {
            "type": "array",
            "items": {
              "type": "object",
              "required": [
                "orderable_material_id",
                "count",
                "lab_id"
              ],
              "properties": {
                "orderable_material_id": {
                  "type": "string"
                },
                "count": {
                  "type": "integer,string"
                },
                "lab_id": {
                  "type": "string"
                }
              }
            }
          },
          "material_orders": {
            "type": "array",
            "items": {
              "type": "object",
              "required": [
                "count",
                "lab_id",
                "supplier_name",
                "sku",
                "price",
                "smiles",
                "tier",
                "cas_number"
              ],
              "anyOf": [
                { "required": [ "mass_per_container" ] },
                { "required": [ "volume_per_container" ] }
              ],
              "properties": {
                "count": {
                  "type": "integer,string"
                },
                "lab_id": {
                  "type": "string"
                },
                "supplier_name": {
                  "type": "string"
                },
                "sku": {
                  "type": "string"
                },
                "price": {
                  "type": "number"
                },
                "mass_per_container": {
                  "type": "number"
                },
                "volume_per_container": {
                  "type": "number"
                },
                "mass_units": {
                  "type": "string"
                },
                "volume_units": {
                  "type": "string"
                },
                "smiles": {
                  "type": "string"
                },
                "tier": {
                  "type": "string"
                },
                "cas_number": {
                  "type": "string,null"
                }
              }
            }
          }
        }
      }

      def bulk_create
        validate_json(BULK_CREATE_SCHEMA, params.to_unsafe_hash)

        authorize(KitOrder.new, :create?)
        kit_orders = params[:kit_orders] || []
        material_orders = params[:material_orders] || []
        response = {
          kit_orders: []
        }

        ActiveRecord::Base.transaction do
          kit_orders.each do |order|
            kit_order = create_kit_order(order)

            SlackMessageForKitOrderJob.perform_async(kit_order.id)
            response[:kit_orders].append(kit_order)
          end

          material_orders.each do |order|
            material_order = create_material_order(order)

            material_order.save!
            SlackMessageForKitOrderJob.perform_async(material_order.id)
            response[:kit_orders].append(material_order)
          end
        end

        render json: response, status: :created
      rescue ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid => e
        render json: { errors: [ e.message ] }, status: :unprocessable_entity
      rescue InvalidOperation => e
        render json: { errors: [ e.message ] }, status: :bad_request
      end

      def create_kit_order(order)
        order_params = order.permit("orderable_material_id", "count", "lab_id")
        kit_order    = KitOrder.new(order_params)
        kit_order.user_id = current_user.try(:id)
        authorize(kit_order, :create?)
        kit_order.state = "PENDING"

        kit_order.save!
        kit_order.reindex(mode: :inline, refresh: :wait_for)
        kit_order
      end

      def create_material_order(order_params)
        lab_id, smiles, cas_number = order_params.values_at(:lab_id, :smiles, :cas_number)
        compound_id = public_create_compound(smiles, cas_number)
        orderable_material = OrderableMaterial.find_or_create_individual_orderable_material(
          order_params.merge(compound_id: compound_id), pundit_user
        )
        create_kit_order(ActionController::Parameters.new({ orderable_material_id: orderable_material.id,
                                                            count: order_params[:count], lab_id: lab_id }))
      end

      def search
        authorize(KitOrder.new, :show?)
        q = params[:q].try(:strip).blank? ? '*' : params[:q]
        sort_by = params[:sort] || 'created_at'
        search_field = params[:search_field]
        lab_id = params[:filter]&.dig(:lab)
        status = params[:filter]&.dig(:status)
        material_type = params[:filter]&.dig(:material_type)
        vendor = params[:filter]&.dig(:vendor)
        smiles_query = q[0..1].casecmp('s:') == 0

        labs_by_feature = lab_ids_by_feature(MANAGE_KIT_ORDERS)
        labs_filter = if labs_by_feature.include? lab_id
                        [ lab_id ]
                      else
                        labs_by_feature
                      end

        if sort_by.starts_with?('-')
          sort_by = sort_by[1, sort_by.length]
          sort_order = :desc
        else
          sort_order = :asc
        end

        where = {}

        where["lab_id"] = labs_filter
        if status.present? && status != 'all'
          status_array = status.upcase.split(',')
          where["state"] = status_array
        end

        if material_type.present?
          where["material_type"] = material_type
        end

        if vendor.present?
          where["vendor"] = vendor
        end

        if smiles_query
          smiles = q[2..q.length - 1]
          q = '*'
          compounds = CompoundService.summarize_compounds([ { smiles: smiles } ])
          where["compound_ids"] = compounds.map(&:id)
        end

        if search_field == 'group_item_name'
          orderable_material_components =
            OrderableMaterialComponent.where(id: q).or(OrderableMaterialComponent.where('name ILIKE ?', "%#{q}%"))
          if orderable_material_components.present?
            kit_orders = []
            orderable_material_components.each do |omc|
              orderable_material_id = omc.orderable_material_id
              kit_order = KitOrder.where(orderable_material_id: orderable_material_id)

              if !kit_order.empty?
                kit_orders.push(kit_order.first)
              end
            end
            where["id"] = kit_orders.map { |ko| ko[:id] }
          else
            render json: {
              results: [],
              total_count: 0
            }
            return
          end
        end

        order = [ { sort_by => sort_order } ]

        exact_match = q.starts_with?("\"") && q.ends_with?("\"")

        if exact_match
          q = q[1..q.length - 2]
          fields = [ search_field ]

          lab_ids_filter = {
            terms: {
              lab_id: labs_filter
            }
          }

          filter = [ lab_ids_filter ]

          if material_type.present?
            material_type_filter = {
              term: {
                material_type: material_type
              }
            }
            filter.push(material_type_filter)
          end

          if vendor.present?
            vendor_filter = {
              term: {
                vendor: vendor
              }
            }
            filter.push(vendor_filter)
          end

          if status.present? && status != 'all'
            status_array = status.upcase.split(',')
            status_filter = {
              terms: {
                state: status_array
              }
            }
            filter.push(status_filter)
          end

          request = SearchkickUtil::ExactMatchSearchHelper.search(q, params[:page], params[:per_page], filter, order,
                                                                  fields, KitOrder)
        else
          fields = []
          case search_field
          when 'name'
            fields.push({ name: :word_start })
          when 'vendor_order_id'
            fields.push({ vendor_order_id: :word_start })
          end

          search_by_group_item_name = search_field == 'group_item_name' && !where["id"].nil?
          final_query = search_by_group_item_name ? '*' : q
          fields = search_by_group_item_name ? [ 'id' ] : fields

          request = KitOrder.search(
            final_query,
            fields: fields,
            where: where,
            per_page: (params[:per_page] or 10),
            page: (params[:page] or 1),
            order: order,
            body_options: { min_score: 1 }
          )
        end

        results = request.results

        render json: {
          results: results.as_json(KitOrder.full_json),
          total_count: request.total_count
        }
      end

      def current
        scope = Pundit.policy_scope!(pundit_user, KitOrder)
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end
        orders = scope.where(checked_in_at: nil).order('created_at DESC')
        render json: orders
      end

      def update
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end

        scope = Pundit.policy_scope!(pundit_user, KitOrder)

        kit_order = scope.find(params.require(:id))

        if kit_order.checked_in_at.present?
          return head :bad_request
        end

        if kit_order.update(model_update_params)
          render json: kit_order
        else
          render json: kit_order.errors, status: :unprocessable_entity
        end
      end

      def update_many
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end

        scope = Pundit.policy_scope!(pundit_user, KitOrder)

        order_ids = params.require(:order_ids)
        order_params = params.require(:order).permit(
          :state, :vendor_order_id
        )

        ActiveRecord::Base.transaction do
          order_ids.each do |order_id|
            order = scope.find(order_id)
            order.update!(order_params)
            order.reindex(mode: :inline, refresh: :wait_for)
          end
        end

        show_many
      end

      def show_many
        scope = Pundit.policy_scope!(pundit_user, KitOrder)
        order_ids = params.require(:order_ids)
        orders = scope.where(id: order_ids)

        orders.each do |order|
          authorize(order, :show?)
        end

        render json: orders
      end

      def destroy
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end
        scope = Pundit.policy_scope!(pundit_user, KitOrder)

        error = destroy_kit_order(scope, params.require(:id))
        if !error.present?
          head :ok
        else
          head :unprocessable_entity
        end
      end

      def destroy_many
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end
        scope = Pundit.policy_scope!(pundit_user, KitOrder)

        order_ids = params.require(:order_ids)

        error_response = {}

        ActiveRecord::Base.transaction do
          order_ids.each do |order_id|
            error = destroy_kit_order(scope, order_id)
            if error.present?
              error_response[order_id] = error
            end
          end
          unless error_response.empty?
            raise ActiveRecord::Rollback
          end
        end
        if error_response.empty?
          head :ok
        else
          render json: error_response, status: :bad_request
        end
      end

      def model_update_params
        params.require(:kit_order).permit(
          "orderable_material_id",
          "checked_in_at",
          "count",
          "note",
          "received_at",
          "state",
          "tracking_code",
          "vendor_order_id"
        )
      end

      def checkin
        kit_order_id = params.require('id')
        kit_order = kit_order_checkin(kit_order_id)
        kit_order.reindex(mode: :inline, refresh: :wait_for)

        return render json: {
          kit_order: kit_order
        }, status: :created
      end

      def material_checkin
        validate_json(KIT_ORDER_MATERIAL_CHECKIN_SCHEMA, params.to_unsafe_hash)
        kit_order = params[:kit_order]

        response = []
        errors = []
        has_errors = false

        ActiveRecord::Base.transaction do
          lab_id_list = kit_order[:data].map { |item|
            loc_id = item[:container][:location_id]
            Location.exists?(loc_id) && Location.find(loc_id).lab_id
          }.uniq

          if lab_id_list.length == 1
            omc_id = kit_order[:data][0][:container][:orderable_material_component_id]
            location_id = kit_order[:data][0][:container][:location_id]
            orderable_material_id = OrderableMaterialComponent.find(omc_id).orderable_material_id
            lab_id = Location.find(location_id).lab_id

            created_kit_order = create_kit_order(ActionController::Parameters.new({
              orderable_material_id: orderable_material_id,
              count: 1,
              lab_id: lab_id
            }))
            request_kit_order_id = kit_order[:id]
            kit_order[:id] = created_kit_order.id

            kit_order[:data].each do |item|
              item[:container][:lab_id] = lab_id
            end

            kit_order_resp = create_containers_with_checkin_data(kit_order)
            if kit_order_resp[:errors].empty?
              response << kit_order_resp.except(:errors)
            else
              kit_order_resp[:id] = request_kit_order_id
              errors << kit_order_resp.except(:containers)
              has_errors = true
            end
          else
            has_errors = true
            error_resp = { id: "0", errors: [] }
            kit_order[:data].each.with_index do |_, idx|
              err = { "#{idx}": { 'lab_id': [ 'All containers locations should belong to the same lab' ] }}
              error_resp[:errors] << err
            end
            errors << error_resp
          end
          if has_errors
            render json: errors, status: :unprocessable_entity
            raise ActiveRecord::Rollback
          end
          KitOrder.find(response[0][:id]).reindex(mode: :inline, refresh: :wait_for)
          render json: response, status: :ok
        end
      end

      def bulk_checkin
        validate_json(KIT_ORDER_BULK_CHECKIN_SCHEMA, params.to_unsafe_hash)
        kit_orders = params[:kit_orders]

        bulk_response = []
        errors = []
        has_errors = false

        ActiveRecord::Base.transaction do
          kit_orders.each do |kit_order|
            kit_order_resp = create_containers_with_checkin_data(kit_order)
            if kit_order_resp[:errors].empty?
              bulk_response << kit_order_resp.except(:errors)
            else
              errors << kit_order_resp.except(:containers)
              has_errors = true
            end
          end

          if has_errors
            render json: errors, status: :unprocessable_entity
            raise ActiveRecord::Rollback
          end

          kos = []
          bulk_response.each do |resp|
            kos << resp[:kit_order]
          end
          KitOrder.where(id: kos).reindex(mode: :inline, refresh: :wait_for)
          render json: bulk_response, status: :ok
        end
      end

      private

      def create_containers_with_checkin_data(kit_order)
        kit_order_id = kit_order[:id]
        order = KitOrder.find(kit_order_id)

        kit_order_resp = { id: kit_order_id, containers: [], errors: [] }

        has_invalid_lab_ids = kit_order[:data].any? { |item| item[:container][:lab_id] != order.lab_id }

        if has_invalid_lab_ids
          kit_order[:data].each.with_index do |item, i|
            if item[:container][:lab_id] != order.lab_id
              err = { "#{i}": { 'lab_id': [ 'Container lab_id does not match the order\'s lab_id' ] }}
              kit_order_resp[:errors] << err
            end
          end
        else
          container_data = kit_order[:data]
          container_data.each.with_index do |ct, idx|
            container_attrs = container_params(ct)
            aliquot_attrs = aliquot_params(ct)
            validation_errors = validate_kit_order_params(container_attrs, aliquot_attrs)
            container_attrs[:kit_order_id] = kit_order_id
            container_attrs[:lab_id] =
              container_attrs[:lab_id] ||
              Organization.find(container_attrs[:organization_id] || @organization.id).labs&.first&.id
            if validation_errors.empty?
              begin
                resp = Container.create_with_attributes(container_attrs, aliquot_attrs, pundit_user)
                if resp[:created].present?
                  kit_order_resp[:containers] << resp[:created].as_json(Container.flat_json)
                elsif resp[:updated].present?
                  kit_order_resp[:containers] << resp[:updated].as_json(Container.flat_json)
                elsif resp[:errors].present?
                  err = { "#{idx}": resp[:errors] }
                  kit_order_resp[:errors] << err
                end
              rescue ActiveRecord::RecordInvalid => e
                validation_err = { "#{idx}": e.message }
                kit_order_resp[:errors] << validation_err
              end
            else
              validation_err = { "#{idx}": validation_errors }
              kit_order_resp[:errors] << validation_err
            end
          end
        end
        if kit_order_resp[:errors].empty?
          kit_order = kit_order_checkin(kit_order_id)
          kit_order_resp[:kit_order] = kit_order
        end
        kit_order_resp
      end

      def validate_kit_order_params(container_params, aliquot_params)
        validation_errors = {}
        barcode, location_id, container_type_id = container_params.values_at(:barcode, :location_id, :container_type_id)
        orderable_material_component_id = container_params[:orderable_material_component_id]
        lot_no, volume_ul, mass_mg = aliquot_params[0].values_at(:lot_no, :volume_ul, :mass_mg)

        unless OrderableMaterialComponent.exists?(orderable_material_component_id)
          validation_errors.merge!(
            { "orderable_material_component":
                [ "Orderable material component '#{orderable_material_component_id}' does not exist" ] }
          )
        end

        if barcode.blank?
          validation_errors.merge!({ "barcode": [ "Barcode can not be null or empty" ] })
        end

        if lot_no.blank?
          validation_errors.merge!({ "lot_no": [ "Lot number can not be null or empty" ] })
        end

        is_valid_container = ContainerType.exists?(container_type_id)

        if is_valid_container
          container_type = ContainerType.find(container_type_id)
          if container_type.is_retired?
            container_type_err = { "container_type_id": [ "container type #{container_type_id} is retired" ] }
            validation_errors.merge!(container_type_err)
          else
            max_volume = container_type.well_volume_ul
            max_mass = 2 * max_volume

            volume_ul = volume_ul&.to_f
            mass_mg = mass_mg&.to_f
            if (volume_ul.nil? && mass_mg.nil?) || (volume_ul == 0 && mass_mg == 0) ||
               (volume_ul && (volume_ul < 0 || volume_ul > max_volume)) ||
               (mass_mg && (mass_mg < 0 || mass_mg > max_mass))
              volume_or_mass_err = {
                "volume_mass": [ "Either mass or volume must be specified, volume should be between 0 "\
                                 "and #{max_volume} and mass should be between 0 and #{max_mass}" ]
              }
              validation_errors.merge!(volume_or_mass_err)
            end
          end
        else
          container_type_err = { "container_type_id": [ "Couldn't find container type with id=#{container_type_id}" ] }
          validation_errors.merge!(container_type_err)
        end

        unless Location.exists?(location_id)
          validation_errors.merge!({ "location_id": [ "Couldn't find location with id=#{location_id}" ] })
        end

        validation_errors
      end

      def container_params(data)
        data.require(:container).permit(
          :barcode,
          :container_type_id,
          :expires_at,
          :kit_order_id,
          :label,
          :location_id,
          :status,
          :storage_condition,
          :lab_id,
          :organization_id,
          :orderable_material_component_id
        )
      end

      def aliquot_params(data)
        data.fetch(:aliquots, []).map do |a|
          a.permit(:name, :volume_ul, :resource_id, :well_idx, :lot_no, :mass_mg)
        end
      end

      def kit_order_checkin(kit_order_id)
        if current_user
          authorize(KitOrder.new, :is_authorized?)
        end
        scope = Pundit.policy_scope!(pundit_user, KitOrder)

        kit_order               = scope.find kit_order_id
        kit_order.checked_in_at = Time.now
        kit_order.state = 'CHECKEDIN'

        # kit = kit_order.kit
        # still_depleted = Kit.kits_to_reorder.include?(kit)
        # if !still_depleted
        #   kit.update(depleted_at: nil)
        # end
        kit_order.save!

        return kit_order
      end

      def public_create_compound(smiles, cas_number)
        compounds = [ {
          attributes: {
            compound: {
              smiles: smiles,
              cas_number: cas_number
            }
          }
        } ]
        authorize(:compound_link, :create_public?)
        compound_link = CompoundServiceFacade::CreateCompounds.call(compounds)
        if compound_link[:created].empty?
          raise InvalidOperation, "Compound registration failed : #{compound_link[:errored].first}"
        else
          compound_link[:created][0].compound_id
        end
      end

      def destroy_kit_order(scope, order_id)

        kit_order = scope.find(order_id)
        if kit_order.state != 'PENDING'
          return "Kit Orders in 'Pending' state are only allowed to be destroyed"
        else
          unless kit_order.destroy
            return "Unprocessable entity"
          end
        end
      rescue ActiveRecord::RecordNotFound
        return "Couldn't find KitOrder with id=#{order_id}"

      end
    end
  end
end

class InvalidOperation < StandardError
  def initialize(err_str)
    @err_str = err_str
  end

  def message
    @err_str
  end
end
