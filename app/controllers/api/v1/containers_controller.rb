module Api
  module V1
    class ContainersController < Api::ApiController

      UPDATE_MANY_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "attributes": {
            "type": "object",
            "properties": {
              "container_ids": {
                "type": "array",
                "items": [
                  {
                    "type": "string"
                  }
                ]
              },
              "container": {
                "type": "object",
                "properties": {
                  "location_id": {
                    "type": "string"
                  }
                }
              }
            },
            "required": [
              "container_ids",
              "container"
            ]
          }
        },
        "required": [
          "attributes"
        ]
      }
      BULK_CREATE_SAMPLE_CONTAINER_SCHEMA = JSON.parse(
        File.read(
          Rails.root.join(
            'app/models/schemas/sample_container_create_bulk.json'
          )
        )
      )
      BULK_JSON = File.read(Rails.root.join('app/models/schemas/container_bulk.json'))
      BULK_SCHEMA = JSON.parse(BULK_JSON)
      TRANSFER_MANY_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "container_ids": {
            "type": "array",
            "items": [
              {
                "type": "string"
              }
            ]
          },
          "organization_id": {
            "type": "string"
          }
        },
        "required": [
          "container_ids",
          "organization_id"
        ]
      }

      RELOCATE_MANY_SCHEMA = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "container_ids": {
            "type": "array",
            "items": [
              {
                "type": "string"
              }
            ]
          },
          "location_id": {
            "type": "string"
          }
        },
        "required": [
          "container_ids",
          "location_id"
        ]
      }

      def create
        properties = params[:container][:properties]
        attributes = container_params
        attributes[:lab_id] =
          attributes[:lab_id] || Organization.find(attributes[:organization_id] || @organization.id).labs&.first&.id
        if properties
          attributes = attributes.merge({ properties: properties.to_unsafe_hash })
        end

        # Expecting {aliquots: [{key: ?, ...}]
        aliquot_params = params.fetch(:aliquots, []).map do |a|
          a.require(:well_idx)
          a.permit(:name, :volume_ul, :resource_id, :well_idx, :lot_no, :mass_mg)
        end

        data = Container.create_with_attributes(attributes, aliquot_params, pundit_user)
        if data[:created].present?
          render json: data[:created].as_json(Container.full_json), status: :created
        elsif data[:updated].present?
          render json: data[:updated].as_json(Container.full_json), status: :ok
        end
      end

      def destroy
        begin
          container = Container.find params.require('id')
        rescue ActiveRecord::RecordNotFound
          return render json: { error_message: "Container not found, may already be destroyed." }, status: :gone
        end
        authorize(container, :delete?)

        container.confirm_destroy()
        if container.errors.count == 1
          return render json: { error_message: container.errors[:base].first }, status: :bad_request
        end

        render json: container.as_json(Container.full_json)
      end

      def destroy_many
        containers = Container.find(params[:data][:attributes][:container_ids])
        response = []
        ActiveRecord::Base.transaction do
          containers.each do |container|
            authorize(container, :destroy?)
            container.confirm_destroy()
            if container.errors.count == 1
              return render json: { error_message: container.errors[:base].first }, status: :bad_request
            end

            response.append({ id: container.id })
          end
        end
        render json: response, status: :ok
      end

      def bulk_destoy_one(id)
        begin
          container = Container.find(id)
          authorize(container, :delete?)
        rescue ActiveRecord::RecordNotFound
          return "Container not found, may already be destroyed."
        rescue Pundit::NotAuthorizedError
          return "Not Authorized"
        end

        container.confirm_destroy()
        if container.errors.count == 1
          return container.errors[:base].first
        end

        return ""
      end

      def bulk_operation
        # doing only delete operation now
        # later will do relocate
        response = []
        should_rollback = false
        data = params.require(:data).to_unsafe_hash
        validate_json(BULK_SCHEMA, data)

        requests = data[:requests]

        ActiveRecord::Base.transaction do
          requests.each do |req|

            req[:error] = bulk_destoy_one(req[:container_id])
            response.append(req)
            if req[:error] != ""
              should_rollback = true
            end

          end
          if should_rollback
            raise ActiveRecord::Rollback
          end
        end
        render json: response, status: :ok
      end

      def request_destroy
        begin
          container = Container.find params.require('id')
        rescue ActiveRecord::RecordNotFound
          return render json: { error_message: "Container not found, may already be destroyed." }, status: :gone
        end
        authorize(container, :destroy?)

        if (error = container.request_destroy(current_user))
          return render json: { error_message: error }, status: :bad_request
        end

        render json: container.as_json(Container.full_json)
      end

      def search_stock
        page            = (params[:page] || 1).to_i
        per_page        = (params[:per_page] || 10).to_i
        offset          = per_page * (page - 1)
        order_by        = params[:order_by] || 'created_at'
        order           = params[:order_desc] == 'true' ? "DESC" : "ASC"
        min_quantity      = (params[:min_quantity] || '0').to_i
        measurement_unit  = params[:measurement_unit] || 'volume_ul'
        include_plates  = params[:include_plates] == 'true'
        include_expired = params[:include_expired] == 'true'

        container_order_by = [ 'id', 'barcode', 'container_type_id', 'label', 'location_id', 'expires_at' ]
        aliquot_order_by   = [ 'volume_ul', 'mass_mg', 'lot_no', 'created_at' ]
        valid_order_by     = container_order_by + aliquot_order_by

        if not valid_order_by.include?(order_by)
          return render json: {
            errors: [ "Order by must be one of #{valid_order_by}" ]
          }, status: :bad_request
        end

        # Generate order_by clause
        #   We must generate SQL order by strings as activerecord doesn't allow
        #   ordering by joins via a hash object, though arel might.
        if order_by == 'location_id'
          position_order = order == "DESC" ? "ASC" : "DESC"
          order_by_clause = "containers.location_id #{order}, containers.slot ->> 'row' #{position_order}"
        elsif container_order_by.include?(order_by)
          order_by_clause = "containers.#{order_by} #{order}"
        else
          order_by_clause = "aliquots.#{order_by} #{order}"
        end

        resource_id    = params.require(:resource_id)
        instruction_id = params[:instruction_id]
        supplier_id = nil
        vendor_id = nil
        concentration = nil
        if instruction_id
          instruction = Instruction.find(instruction_id)
          parsed_instruction = instruction.parsed
          if parsed_instruction.op == "provision" && parsed_instruction.resource_constraints.present?
            supplier_id = parsed_instruction.resource_constraints["supplier_id"]
            vendor_id = parsed_instruction.resource_constraints["vendor_id"]
            concentration = parsed_instruction.resource_constraints["starting_concentration"]
          end
        end

        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)

        org_labs = Lab.where(operated_by: @organization)
        org_lab_ids = []
        org_labs.each do |lab|
          org_lab_ids.append(lab.id)
        end

        lab_ids.select { |lab_id| org_lab_ids.include?(lab_id) }

        all_containers = Container.all_provision_containers(resource_id, min_quantity, include_plates, include_expired,
                                                            measurement_unit, lab_ids, supplier_id, vendor_id,
                                                            concentration)
                                  .order(order_by_clause)

        if instruction_id
          instruction = Instruction.find(instruction_id)

          if instruction.op == 'dispense'
            # dispense can only come from vendor tubes.
            all_containers = all_containers.where(container_type_id: 'vendor-tube')
          end
        end
        # prefetch aliquots and locations for performance.
        container_ids = all_containers.pluck(:id)
        location_ids  = all_containers.pluck(:location_id).uniq
        aliquots      = Aliquot.where(container_id: container_ids)
        locations     = Location.where(id: location_ids)

        total_count = all_containers.size
        containers  = all_containers.drop(offset).take(per_page)

        containers.each do |container|
          authorize(container, :authorized_in_lab?)
        end

        # manually add aliquots and locations
        containers_json = containers.as_json(Container.flat_json)
        containers_json.each do |container|
          aliquot = aliquots.find { |a| a.container_id == container["id"] }
          location = locations.find { |l| l.id == container["location_id"] }
          container[:aliquots] = [ aliquot.as_json(Aliquot.flat_json) ]
          container[:location] = location.as_json(Location.short_json)
        end

        render json: {
          results: containers_json,
          num_pages: (total_count.to_f / per_page).ceil,
          per_page: per_page
        }
      end

      def container_params
        params.require(:container).permit(
          :barcode,
          :suggested_barcode,
          :container_type_id,
          :cover,
          :expires_at,
          :kit_order_id,
          :label,
          :location_id,
          :shipment_id,
          :status,
          :storage_condition,
          :test_mode,
          :lab_id,
          :organization_id,
          :orderable_material_component_id
        )
      end

      def log_location_override
        authorize(Container.new, :log_location_override?)
        override_params = params.permit(:reason, :suggested_location_id, :container_id,
                                        :chosen_location_id, :container_storage_condition,
                                        :container_type_id, :initial_location_id)

        attrs = override_params.to_h

        attrs[:admin_id] = pundit_user.user.id

        log = LocationPickerLog.create!(attrs)
        LocationPickerSlackMessage.perform_async(log.id)

        head :ok
      end

      def log_location_pick_success
        authorize(Container.new, :log_location_pick_success?)
        log_params = params.permit(:suggested_location_id, :container_id,
                                   :container_storage_condition, :container_type_id,
                                   :initial_location_id)

        attrs = log_params.to_h

        attrs[:admin_id] = pundit_user.user.id

        LocationPickerLog.create!(attrs)

        head :ok
      end

      def restore
        begin
          container = Container.find params.require(:id)
        rescue ActiveRecord::RecordNotFound
          return render json: { error_message: "Container destruction has already been processed." }, status: :gone
        end
        authorize(container, :destroy?)
        if (error = container.undo_destroy())
          return render json: { error_message: error }, status: :bad_request
        end

        render json: container.as_json(Container.full_json)
      end

      def transfer_many
        validate_json(TRANSFER_MANY_SCHEMA, params.to_unsafe_hash)

        container_ids = params[:container_ids]
        org_id = params[:organization_id]
        results = ContainersTransferService.call(container_ids, org_id, self.request.fullpath)
        render json: { :data => { :attributes => results }}
      end

      def update
        scope = Pundit.policy_scope!(pundit_user, Container)
        id = params.require(:id)

        container = update_internal(scope.with_deleted.find(id), params[:data])

        render json: serialize_container(container)
      end

      def update_many
        validate_json(UPDATE_MANY_SCHEMA, params.require(:data).to_unsafe_hash)
        scope = Pundit.policy_scope!(pundit_user, Container)

        container_ids = params.require(:data).require(:attributes).require(:container_ids)
        containers = []

        ActiveRecord::Base.transaction do
          container_ids.each do |container_id|
            container = update_internal(scope.with_deleted.find(container_id), params[:data])
            containers.push(container)
          end
        end

        render json: serialize_containers(containers)
      end

      def show_many
        scope = Pundit.policy_scope!(pundit_user, Container)
        container_ids = params[:data][:attributes][:container_ids]
        containers = scope.with_deleted.where(id: container_ids)

        containers.each do |container|
          authorize(container, :index?)
        end
        render json: serialize_containers(containers)
      end

      def relocate_many
        validate_json(RELOCATE_MANY_SCHEMA, params.to_unsafe_hash)

        container_ids = params[:container_ids]
        location_id = params[:location_id]

        results = ContainersRelocateService.call(container_ids, location_id, pundit_user, self.request.fullpath)
        render json: { :data => { :attributes => results }}
      end

      # Move a container to a new location, or to a position within a location
      def relocate
        container = Container.find(params.require(:id))
        container_params = params.require(:container).permit(:location_id, :position)
        container_id     = params.require(:id)
        location_id      = container_params.require(:location_id)
        position         = container_params[:position] # This should be in the container params

        authorize(container, :move?)

        container, errors = LocationService.move(container_id, location_id, position)

        if errors.empty?
          render json: container
        else
          render json: errors, status: :bad_request
        end
      end

      def search
        # find containers by label or aliquot name
        query = params[:query].try(:strip).blank? ? '*' : params[:query]
        exact_match = query.starts_with?("\"") && query.ends_with?("\"") ? true : false
        if exact_match
          query = query[1..query.length - 2]
        end

        delete_must_not_exit = {
          bool: {
            must_not: {
              exists: {
                field: "deleted_at"
              }
            }
          }
        }

        where = {
          deleted_at: nil
        }

        search_by_score = {
          _score: "desc"
        }

        filter = [ delete_must_not_exit ]

        authorize(Container.new, :search?)
        add_scope(where, @organization)

        sort = [ search_by_score ]

        labs = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        lab_filter = {
          terms: {
            lab_id: labs
          }
        }
        filter.push(lab_filter)

        fields = [ { 'id' => :word_start },
                   { 'barcode' => :word_start },
                   { 'label' => :word_middle } ]

        if exact_match
          fields = [ 'label', 'barcode', 'id' ]
          request = SearchkickUtil::ExactMatchSearchHelper.search(query,
                                                                  params[:page],
                                                                  params[:per_page],
                                                                  filter,
                                                                  sort,
                                                                  fields,
                                                                  Container)
        else
          request = Container.search(
            query,
            where: where,
            index_name: Container.searchkick_index.name,
            fields: fields,
            order: { _score: :desc },
            offset: (params[:offset] or 0),
            per_page: (params[:per_page] or 10),
            page: (params[:page] or 1)
          )
        end
        render json: {
          results: request.results.map { |res| res.as_json(Container.aliquots_json) },
          num_pages: request.num_pages,
          per_page: request.per_page
        }
      end

      def split
        source = Container.with_deleted.find(params.require(:id))
        authorize(source, :split?)
        # only allow splitting of tube stock.
        if source.organization.present? || !(source.container_type.is_tube && source.aliquots.size == 1)
          return render json: { errors: [ 'Can only split stock containers' ] }, status: :bad_request
        end

        source_aliquot = source.aliquots[0]

        # sanitize container parameters
        attrs_pairs = params.require(:containers).map do |cparams|
          sanitize_container_params(cparams)
        end

        # set resource_id on each aliquot
        attrs_pairs.each do |(c_attrs, a_attrs)|
          c_attrs[:expires_at] = source.expires_at
          c_attrs[:lab_id] = source.lab.id

          a_attrs.each_value do |v|
            v[:resource_id] = source_aliquot.resource_id
            v[:lot_no]      = source_aliquot.lot_no
          end
        end

        total_volume = attrs_pairs.map { |_, a_attrs|
          a_attrs.values.map { |v| v[:volume_ul].to_d }.sum
        }.sum

        total_mass = attrs_pairs.map { |_, a_attrs|
          a_attrs.values.map { |v| v[:mass_mg].to_d }.sum
        }.sum

        containers = []
        ActiveRecord::Base.transaction do
          # update source quantities
          source_aliquot.volume_ul -= total_volume if source_aliquot.volume_ul
          source_aliquot.mass_mg -= total_mass if source_aliquot.mass_mg
          source_aliquot.save!

          # create the aliquots
          attrs_pairs.each do |c_attrs, a_attrs|
            org = nil
            containers << Container.create_with_wells_unsafe(c_attrs, a_attrs, org)
          end

          if (source_aliquot.volume_ul == 0 && source_aliquot.mass_mg.nil?) ||
             (source_aliquot.volume_ul == 0 && source_aliquot.mass_mg == 0)
            # destroy the container when its single aliquot is used.
            source.confirm_destroy
          else
            containers << source
          end
        end

        render json: containers, status: :created
      end

      def errors_for_location_validation
        container = Container.find(params.require(:id))
        render json: {
          id: container.id,
          errors_for_location_validation: container.errors_for_location_validation,
          warnings_for_location_validation: container.warnings_for_location_validation
        }
      end

      def validate_consumable_barcodes
        containers = params[:containers]
        containers.each do |container|
          container_type_id = container.require(:container_type_id)
          barcode = container.require(:barcode)
          lab_id = container.require(:lab_id)
          valid_container = Container.where(container_type_id:  container_type_id,
                                            barcode: barcode, status: Container::STATUS_CONSUMABLE,
                                            lab: Lab.find(lab_id).shared_ccs_labs)

          container['is_valid'] = valid_container.length == 1
          container['container_id'] = valid_container.length == 1 ? valid_container[0]['id'] : nil
        end

        render json: containers, status: :ok
      end

      def is_transferable
        container_ids = params[:containers]
        cannot_transfer_ct = Container
                             .with_deleted
                             .includes(:runs)
                             .where(id: container_ids, status: Container::TRANSFER_BAD_STATUS)
                             .or(Container
                          .includes(:runs)
                          .where(id: container_ids, runs: { 'status': Container::TRANSFER_BAD_RUN_STATUS }))
                             .pluck(:id, :status, :run_id).uniq
        cannot_transfer_map = {}
        cannot_transfer_ct.each do |ct|
          cannot_transfer_map[ct[0]] = { status: ct[1], run_id: ct[2] }
        end
        return render json: {
          can_transfer: container_ids - cannot_transfer_map.keys(),
          cannot_transfer: cannot_transfer_map
        }, status: :ok
      end

      def validate_barcodes
        response = []
        containers_params = params.fetch(:containers, [])
        barcode_lab_map = {}
        containers_params.each do |container_params|
          barcode = container_params.require(:barcode)
          lab_id = container_params.require(:lab_id)
          if barcode_lab_map.fetch(barcode, []).include?(lab_id)
            response << { barcode: barcode, is_valid: false }
            next
          end

          ccs_labs = Lab.find(lab_id).shared_ccs_labs

          container = Container.new barcode: barcode, lab_id: lab_id

          response << {
            barcode: barcode,
            is_valid: container.barcode_uniqueness.nil?
          }
          barcode_lab_map[barcode] = (barcode_lab_map.fetch(barcode, []) + ccs_labs.pluck(:id)).uniq
        end
        render json: response, status: :ok
      end

      def bulk_create_sample_containers
        containers_params = params.require(:containers)
        validate_json(BULK_CREATE_SAMPLE_CONTAINER_SCHEMA,
                      params.to_unsafe_h[:containers])
        response = bulk_create_with_aliquots(containers_params)
        if response[:containers].empty?
          render json: response, status: :bad_request
        else
          response[:containers] = response[:containers].map do |container|
            container.as_json(Container.aliquots_json)
          end
          render json: response, status: :created
        end
      end

      def bulk_create_containers
        containers_params = params.require(:containers)
        validate_json(BULK_CREATE_SAMPLE_CONTAINER_SCHEMA,
                      params.to_unsafe_h[:containers])
        response = bulk_create_with_aliquots(containers_params)
        if response[:containers].empty?
          render json: response, status: :bad_request
        else
          response[:containers] = response[:containers].map(&:id)
          render json: response, status: :created
        end
      end

      private

      def load_contextual_property_configs
        all_ccpcs = ContextualCustomPropertiesConfig.where(organization: @organization)
        all_ccpcs.group_by(&:context_type).transform_values do |by_context|
          by_context.group_by(&:key)
        end
        # returns { <context_type>: { <key>: [list of configs] } }
      end

      def bulk_create_with_aliquots(containers_params)
        response = {
          containers: [],
          errors: nil
        }
        default_lab = @organization.lab_consumers.first
        containers_params.each.with_index do |cparams, index|
          # Convert container params into [container_attrs, aliquots_attrs] which
          # container must be in the form as follows:
          #   {barcode: '', label: '', ..., aliquots: {well_idx: {...}, ...}}
          cparams.require(:container_type)
          cparams[:status] = cparams[:test_mode] ? 'available' : 'inbound'
          container_attrs = cparams.permit(:container_type, :suggested_barcode,
                                           :cover, :status, :label, :storage_condition,
                                           :test_mode, :empty_mass_mg, :lab_id,
                                           :contextual_custom_properties => [ :key, :value ])

          if cparams[:properties]
            container_attrs = container_attrs.merge({ properties: cparams[:properties].to_unsafe_hash })
          end

          if container_attrs[:lab_id].nil?
            container_attrs[:lab_id] = default_lab.lab_id
          end

          container_attrs = container_attrs.to_h
          # need to add container_type after creating the hash
          container_attrs[:container_type] =
            ContainerType.find_by_shortname(cparams.require(:container_type))
          container_attrs[:created_by] = current_user&.id

          # more ungodlyness.
          aliquots_attrs = cparams.fetch(:aliquots, {})
          container = create_container_with_aliquot_and_compound(container_attrs, aliquots_attrs,
                                                                 @organization)
          if container[:created]
            response[:containers].append(container[:created])
          else
            response[:errors] ||= {}
            response[:errors][index] = container[:errored]
          end
        end
        return response
      end

      def get_structured_error(resource_type, object)
        response = resource_type.new(object, context)
        e = JSONAPI::Exceptions::ValidationErrors.new(response)
        return e.errors
      end

      def create_container_with_aliquot_and_compound(container_attrs, aliquots_attrs, organization)
        response = {
          created: nil,
          errored: nil
        }
        container_error = {}
        container_ctx_error = {}
        aq_error = {}
        acl_error = {}

        ccpc_cache = load_contextual_property_configs

        ActiveRecord::Base.transaction do
          bulk_aliquots = []
          bulk_ccps = []

          container = Container.new
          container.organization = organization
          container.update_current_mass_mg_tubes_and_plates(container_attrs, aliquots_attrs)
          container.assign_attributes(container_attrs
            .except('id', 'empty_mass_mg', 'contextual_custom_properties').to_h)
          if container.save
            ctx_properties = container_attrs.fetch(:contextual_custom_properties, [])
            container_ctx_response = create_contextual_custom_property(ctx_properties, container, ccpc_cache)
            unless container_ctx_response[:created].empty?
              bulk_ccps.push(*container_ctx_response[:created])
            end
            if !container_ctx_response[:error].empty?
              container_ctx_error = container_ctx_response[:error]
              raise ActiveRecord::Rollback, "Contextual Custom Properties not created"
            else
              aliquots_attrs.each.with_index do |aq_attrs, index|
                compound_link_attrs = aq_attrs.fetch(:compound_links, [])
                aq             = container.aliquots.build
                aq.id          = Aliquot.generate_snowflake_id
                aq.well_idx    = container.container_type.robot_well(aq_attrs[:well_idx])
                aq_permitted_attrs = aq_attrs.permit('volume_ul', 'mass_mg', 'name')
                if aq_attrs[:properties]
                  aq_permitted_attrs = aq_permitted_attrs.merge({
                    properties: aq_attrs[:properties].to_unsafe_hash
                  })
                end
                aq.assign_attributes(aq_permitted_attrs)
                if aq.valid?
                  bulk_aliquots << aq
                  ctx_properties = aq_attrs.fetch(:contextual_custom_properties, [])
                  aq_contextual_properties_response = create_contextual_custom_property(ctx_properties, aq, ccpc_cache)

                  if !aq_contextual_properties_response[:error].empty?
                    aq_error[index] = {
                      contextual_custom_properties: aq_contextual_properties_response[:error]
                    }
                    raise ActiveRecord::Rollback, "Contextual Custom Properties not created"
                  else

                    compound_link_attrs.each.with_index do |cp_attrs, cl_index|
                      acl = AliquotCompoundLink.new
                      acl.aliquot = aq
                      acl.assign_attributes(cp_attrs.permit('compound_link_id',
                                                            'concentration', 'solubility_flag'))
                      aq.aliquots_compound_links << acl
                      unless acl.valid?
                        acl_error ||= {}
                        acl_error[cl_index] = {
                          errors: [ {
                            message: "AliquotCompoundLink not found",
                            status: "404"
                          } ]
                        }
                        aq_error[index] = { aliquots_compound_links: acl_error }
                        raise ActiveRecord::Rollback, "AliquotCompoundLink not created"
                      end
                    end
                  end
                else
                  aq_error[index] = { errors: get_structured_error(Api::V1::AliquotResource, aq) }
                  raise ActiveRecord::Rollback, "Aliquot not created"
                end
              end
            end

            bulk_aliquots.each(&:run_bulk_import_callbacks)
            Aliquot.import! bulk_aliquots, recursive: true
            ContextualCustomProperty.import!(bulk_ccps)

            response[:created] = container
          else
            container_error = get_structured_error(Api::V1::ContainerResource, container)
          end
        end

        # Reindex the container, as `import` skips callbacks, which are used to trigger reindexing
        response[:created].reindex if response[:created].present?

        generate_output_json(container_error, container_ctx_error, aq_error, response)
      end

      def create_contextual_custom_property(ctx_properties, context, ccpc_cache)
        response = {
          created: [],
          error: {}
        }
        added_ctx_props = Set.new
        ctx_properties.each.with_index do |property, index|
          if added_ctx_props.include?(property[:key])
            response[:error][index] = {
              errors: [
                {
                  message: "duplicate contextual_property Key: '#{property[:key]}'",
                  status: "400"
                }
              ]
            }
          else
            added_ctx_props << property[:key]
            config = ccpc_cache.dig(context.class.name, property[:key])&.first

            if config.present?
              ccp = context.contextual_custom_properties.build
              ccp.id = ContextualCustomProperty.generate_snowflake_id
              ccp.value = property[:value]
              ccp.context_type = context.class.name
              ccp.contextual_custom_properties_config = config

              if ccp.valid?
                response[:created] << ccp
              else
                errors = get_structured_error(Api::V1::ContextualCustomPropertyResource, ccp)
                response[:error][index] = { errors: errors }
              end
            else
              response[:error][index] = {
                errors: [
                  {
                    message: "Key: '#{property[:key]}' not found",
                    status: "404"
                  }
                ]
              }
            end
          end
        end
        response
      end

      def generate_output_json(container_error, container_ctx_error, aq_error, response)
        if !container_error.empty? || !container_ctx_error.empty? || !aq_error.empty?
          response[:errored] = {
            errors: container_error,
            contextual_custom_properties: container_ctx_error,
            aliquots: aq_error
          }
        end
        response
      end

      def update_internal(container, _data)
        authorize(container, :update?)

        attributes = params.require(:data).require(:attributes)

        attributes = attributes[:container] || attributes

        ct_params = attributes.permit(
          :barcode,
          :suggested_barcode,
          :container_type_id,
          :cover,
          :expires_at,
          :kit_order_id,
          :orderable_material_component_id,
          :label,
          :location_id,
          :lab_id,
          :organization_id,
          :shipment_id,
          :status,
          :storage_condition,
          :test_mode
        )

        properties = attributes[:properties]
        if properties
          ct_params = ct_params.merge({ properties: properties.to_unsafe_hash })
        end

        if ct_params[:location_id]
          if ct_params[:location_id].empty?
            ct_params[:location_id] = nil
          else
            authorize(container, :move?)
            _, errors = LocationService.move(container.id, ct_params[:location_id])
            if !errors.empty?
              raise ActionController::BadRequest, errors
            end
          end
        end

        container.update!(ct_params)
        container
      end

      def serialize_containers(containers)
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::ContainerResource)
        resources  = containers.map { |ct| Api::V1::ContainerResource.new(ct, context) }
        json       = serializer.serialize_to_hash(resources)

        json[:data].each do |d|
          d['attributes']['location'] = containers.find { |r| r[:id] == d['id'] }.location.as_json(Location.short_json)
        end

        json
      end

      def serialize_container(container)
        resource = Api::V1::ContainerResource.new(container, context)
        serializer = Api::V1::ContainerResource.serializer
        serializer.serialize_to_hash(resource)
      end

      def add_scope(where, _org)
        labs = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        where[:lab_id] = labs
      end
    end
  end
end
