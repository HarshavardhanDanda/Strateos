module Api
  module V1
    class RunsController < Api::ApiController

      RUNSCHEDULE_SCHEMA = {
        type: "object", additionalProperties: true, minProperties: 0,
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                workunit_id: { "type": "string" },
                schedule_date: { "type": "string" },
                end_date_time: { "type": "string" },
                id: { "type": [ "string", "null" ] }
              },
              required: [ "workunit_id", "schedule_date", "end_date_time" ]
            }
          },
          deleted_runSchedule: {
            type: "array", additionalProperties: true,
            items: { "type": "string" }
          }
        }
      }

      def context
        {
          user_context: pundit_user,
          action: action_name,
          custom_params: params[:custom_params],
          includes: params[:include].present? ? [ params[:include] ] : [],
          fields: fields
        }
      end

      def show
        if params[:json_type] == 'admin_full_json'
          scope = Pundit.policy_scope!(pundit_user, Run)
          run = scope.find(params.require(:id))
          authorize(run, :show?)
          return render json: run.as_json(Run.admin_full_json)
        end
        if params[:include].nil? && authorized?(Batch, :index?)
          params[:include] = "batch"
          # we need to add `batch` to the runs fields to obtain the `relationships` within the `data` object
          params[:fields][:runs] += ",batch"
        end
        super
      end

      def get_tree
        scope = Pundit.policy_scope!(pundit_user, Run)
        run = scope.find(params.require(:id))
        authorize(run, :show?)
        ancestor = run

        ancestor = scope.find(ancestor.predecessor_id) until ancestor.predecessor_id.nil?

        render json: serialize_run(ancestor, context[:includes], context[:fields])
      end

      def update
        run = Run.find(params.require(:id))
        authorize(run, :update?)
        if params[:status]
          manual = params[:manual].to_i == 1
          run.set_status(params[:status].to_sym, manual)
        end

        if params[:project_id]
          transfer_run(run, params[:project_id])
        end

        run_params = params.permit(
          :scheduled_to_start_at, :estimated_run_time_cache,
          :scheduled_workcell, :canceled_reason, :aborted_reason, :internal_run
        )

        run.assign_attributes(run_params.to_h)

        if run.errors.empty? && run.save
          render json: run.as_json(Run.admin_json)
        else
          render json: run.errors, status: :unprocessable_entity
        end
      end

      def cancel
        run_ids = params.require(:run_ids)
        runs = Run.where(id: run_ids)
        errors = []

        if run_ids.size != runs.size
          return render json: { errors: [ "invalid run_ids : #{run_ids - runs.map(&:id)}" ] }, status: :bad_request
        end

        runs.each do |run|
          authorize(run, :update?)
          run.cancel_and_cleanup
          unless run.errors.empty?
            errors.push({ errors: run.errors, id: run.id })
          end
        end

        unless errors.empty?
          return render json: { error_list: errors }, status: :unprocessable_entity
        end

        head :ok
      end

      def claim
        @run = Run.find(params.require(:id))
        authorize(@run, :claim?)
        @run.assigned_to = current_user

        if @run.save
          # reindex is required to update assigned_to field
          @run.reindex(mode: :inline, refresh: :wait_for)
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      def assign
        run_id = params.require(:id)
        assigned_to_user = User.find(params.require(:assigned_to_id))
        @run = Run.find(run_id)
        lab = @run.lab
        authorize(@run, :assign?)
        if !assigned_to_user.member_of_org?(lab.operated_by)
          return render json: { error: 'User is not part of lab operating organization' }, status: :bad_request
        end

        @run.assigned_to = assigned_to_user
        if @run.save
          # reindex is required to update assigned_to field
          @run.reindex(mode: :inline, refresh: :wait_for)
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      def priority
        run_id = params.require(:id)
        priority = params.require(:priority)
        @run = Run.find(run_id)
        authorize(@run, :priority?)
        @run.priority = priority
        if @run.save
          # reindex is required to update priority field
          @run.reindex(mode: :inline, refresh: :wait_for)
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      def search
        authorize(Run, :search?)
        scope = Pundit.policy_scope!(pundit_user, Run)
        allowed_fields = {
          'id' =>                  { mult: 1, search_type: :word_start },
          'title' =>               { mult: 2, search_type: :word_middle },
          'container_ids' =>       { mult: 1, search_type: :word_start },
          'container_barcodes' =>  { mult: 1, search_type: :word_start }
        }

        query             = params[:query].try(:strip).blank? ? '*' : params[:query]
        search_fields     = params[:search_fields] || allowed_fields.keys
        labs              = params[:lab_id] || []
        operators         = params[:operator_id] || []
        submitters        = params[:submitter_id]
        organizations     = params[:organization_id] || []
        start_date        = params[:start_date]
        end_date          = params[:end_date]
        status            = params[:status]
        sort_by           = params[:sort_by]
        direction         = params[:direction] || :desc
        per_page          = params[:per_page] || 12
        page              = params[:page] || 1
        project_id        = params[:project_id]
        is_run_transfer   = params[:is_run_transfer]
        internal_run      = params[:internal_run]

        where = {}
        filter = []

        # Don't show test runs, if its not run_transfer
        unless is_run_transfer
          where[:test_mode] = false
        end

        unless project_id.nil?
          where[:project_id] = project_id
          filter.push({
            "terms": {
              "project_id": project_id
            }
          })
        end

        if !submitters.nil? && submitters != "all"
          where[:owner_id] = submitters
          filter.push({
            "terms": {
              "owner_id": submitters
            }
          })
        end

        exact_match = query.starts_with?("\"") && query.ends_with?("\"")
        if exact_match
          query = query[1..query.length - 2]
        end

        permitted_labs = lab_ids_by_feature(VIEW_RUNS_IN_LABS)

        unless is_run_transfer
          where[:lab_id] = if !labs&.include?('all') && !labs.empty?
                             permitted_labs & labs
                           else
                             permitted_labs
                           end
        end

        orgs_in_scope = []
        if is_run_transfer
          allowed_fields["protocol_name"] = { mult: 1, search_type: :word_middle }
          allowed_fields = allowed_fields.slice('id', 'title', 'protocol_name')
          search_fields = allowed_fields.keys
          orgs_in_scope.push(@organization.id)
        end

        Lab.includes(:operated_by, :lab_consumers).find(permitted_labs).each do |lab|
          orgs_in_scope.push(lab.operated_by.id)
          lab_org_id = lab.lab_consumers.pluck(:organization_id)
          orgs_in_scope.concat(lab_org_id) if lab_org_id.present?
        end

        where[:organization_id] = if !organizations&.include?('all') && !organizations.empty?
                                    orgs_in_scope.uniq & organizations.uniq
                                  else
                                    orgs_in_scope.uniq
                                  end
        orgs_terms_filter = {
          terms: {
            organization_id: where[:organization_id]
          }
        }
        unless where[:organization_id].nil?
          filter.push(orgs_terms_filter)
        end

        unless operators.empty?
          if operators.include?('all')
            unless operators.include?('unassigned')
              where[:assigned_to] = {}
              where[:assigned_to][:not] = nil
              filter.push({
                "bool": {
                  "must_not": {
                    "bool": {
                      "must_not": {
                        "exists": {
                          "field": "assigned_to"
                        }
                      }
                    }
                  }
                }
              })
            end
          elsif operators.include?('unassigned')
            if operators.length > 1
              where[:assigned_to] = operators - [ 'unassigned' ] + [ nil ]
              filter.push({
                "bool": {
                  "should": [
                    {
                      "bool": {
                        "must_not": {
                          "exists": {
                            "field": "assigned_to"
                          }
                        }
                      }
                    },
                    {
                      "terms": {
                        "assigned_to": operators
                      }
                    }
                  ]
                }
              })
            else
              where[:assigned_to] = nil
              filter.push({
                "bool": {
                  "must_not": {
                    "exists": {
                      "field": "assigned_to"
                    }
                  }
                }
              })
            end
          else
            where[:assigned_to] = operators
            filter.push({
              "terms": {
                "assigned_to": operators
              }
            })
          end
        end

        selected_dates_ranges = {}
        unless start_date.nil?
          selected_dates_ranges[:gte] = start_date
        end

        unless end_date.nil?
          selected_dates_ranges[:lte] = end_date
        end

        if !status.nil? && status != 'all'
          status_array = status.split(',')
          where[:status] = status_array
        end

        unless internal_run.nil?
          where[:internal_run] = internal_run
          filter.push({
            "term": {
              "internal_run": internal_run
            }
          })
        end

        unless selected_dates_ranges.empty?
          date_type = case status
                      when 'accepted'
                        'accepted_date'
                      when 'in_progress'
                        'started_date'
                      when 'complete'
                        'completed_date'
                      when 'aborted'
                        'aborted_date'
                      when 'rejected'
                        'rejected_at'
                      when 'canceled'
                        'canceled_at'
                      else
                        'created_at'
                      end

          where[date_type] = selected_dates_ranges
        end

        terms_filter = {
          terms: {
            status: where[:status]
          }
        }
        if !status.nil? && !status.eql?('all')
          filter.push(terms_filter)
        end

        selected_dates_ranges_filter = {
          range: {
            date_type => {
              from: !start_date.nil? ? start_date : nil,
              include_lower: true,
              to: !end_date.nil? ? end_date : nil,
              include_upper: true
            }
          }
        }

        if !start_date.nil? || !end_date.nil?
          filter.push(selected_dates_ranges_filter)
        end

        bad_fields = search_fields - allowed_fields.keys
        unless bad_fields.empty?
          return render json: { errors: [ "Invalid search fields: #{bad_fields}" ] }, status: :bad_request
        end

        fields = search_fields.map do |name|
          info        = allowed_fields[name]
          mult        = info[:mult]
          search_type = info[:search_type]

          { "#{name}^#{mult}" => search_type }
        end

        default_sort_by = case status
                          when 'accepted'
                            'accepted_date'
                          when 'in_progress'
                            'started_date'
                          when 'complete'
                            'completed_date'
                          when 'aborted'
                            'aborted_date'
                          when 'pending'
                            'created_at'
                          when 'rejected'
                            'rejected_at'
                          when 'canceled'
                            'canceled_at'
                          else
                            'created_at'
                          end

        # These are used to eager_load and apply a select scope during the searchkick search query
        includes = [
          { containers: [ :shipment ] },
          :owner,
          { project: [ :organization, :payment_method ] },
          { protocol: [
            { package: [ :latest_release, :owner, :releases ] },
            :release
          ] },
          :pending_inbound_containers,
          :realized_containers
        ]
        result_scope = ->(r) { r.select(Run.non_json_column_names + [ "quote" ]) }

        sort_by_field = {}
        if sort_by.nil?
          if query.present?
            sort_by_field[:_score] = direction
          end
          sort_by_field[default_sort_by] = { order: direction, unmapped_type: "date" }
        else
          sort_by_field[sort_by] = { order: direction, unmapped_type: "date" }
        end
        sort = [ sort_by_field ]
        if exact_match
          fields = [ 'id', 'title', 'container_ids', 'container_barcodes' ]
          request = SearchkickUtil::ExactMatchSearchHelper.search(query, page, per_page, filter, sort, fields,
                                                                  Run, includes: includes,
                                                                  scope_results: result_scope)
        else
          request = Run.search(
            query,
            fields: fields,
            order:  sort,
            per_page: per_page,
            page: page,
            where: where,
            includes: includes,
            scope_results: result_scope
          )
        end

        results = request.results.as_json(Run.short_json)
        render json: {
          results: results,
          num_pages: request.num_pages,
          per_page: request.per_page,
          total: request.response['hits']['total']
        }
      end

      def approval
        run_id = params.require(:id)
        schedule_type = params.fetch(:schedule_type, nil)

        @run = Run.find(run_id)

        if schedule_type == 'schedule'
          authorize(@run, :schedule?)
        else
          authorize(@run, :approval?)
        end

        if schedule_type == 'schedule' && (@run.status != 'in_progress' && @run.status != 'accepted')
          return render json: { error: 'Run cannot be scheduled' }, status: :bad_request
        elsif schedule_type != 'schedule' && @run.status != 'pending'
          return render json: { error: 'Run cannot be approved' }, status: :bad_request
        end

        if schedule_type != 'schedule'
          @run.accepted_by_id = current_user.id
          @run.accept
        end

        @run.priority = params[:priority] || @run.priority
        if params[:assigned_to_id]
          assigned_to_user = User.find(params[:assigned_to_id])
          if !assigned_to_user.member_of_org?(@run.lab.operated_by)
            return render json: { error: 'User is not part of lab operating organization' }, status: :bad_request
          end

          @run.assigned_to = assigned_to_user
        end

        run_schedule_records = []
        if params[:run_schedule] && !params[:run_schedule][:data].empty?
          authorize(@run, :schedule?)
          if params[:run_schedule][:data].length > 1
            authorize(@run, :multiple_schedule?)
          end

          data = params.require(:run_schedule).to_unsafe_hash
          validate_json(RUNSCHEDULE_SCHEMA, data)
          @run.scheduled_to_start_at = params[:run_schedule][:schedule_start_date]
          params[:run_schedule][:data].each do |run_schedule|
            temp = {}
            temp[:run_id] = @run.id
            temp[:work_unit_id] = run_schedule[:workunit_id]
            temp[:start_date_time] = run_schedule[:schedule_date]
            temp[:end_date_time] = run_schedule[:end_date_time]
            temp[:updated_at] = DateTime.now
            if run_schedule[:id]
              temp[:id] = run_schedule[:id]
              temp[:created_at] = RunSchedule.find(run_schedule[:id]).created_at
            else
              temp[:created_at] = DateTime.now
              temp[:id] = RunSchedule.generate_snowflake_id
              temp[:created_by] = current_user.id
            end
            temp[:updated_by] = current_user.id

            run_schedule_records.push(temp)
          end
        elsif params[:run_schedule] && !params[:run_schedule][:schedule_start_date]
          @run.scheduled_to_start_at = nil
        end

        ActiveRecord::Base.transaction do
          Upsert.batch(RunSchedule.connection, RunSchedule.table_name) do |upsert|
            run_schedule_records.each do |record|
              upsert.row({ :id => record[:id] }, record)
            end
          end

          if params[:run_schedule] && params[:run_schedule][:deleted_runSchedule] &&
             !params[:run_schedule][:deleted_runSchedule].empty?
            RunSchedule.where(:id => params[:run_schedule][:deleted_runSchedule]).destroy_all
          end
          result = if @run.save
                     # reindex is required to update the run fields
                     @run.reindex(mode: :inline, refresh: :wait_for)
                     render json: @run.as_json(Run.flat_json)
                   else
                     render json: @run.errors
                   end
          result
        end
      end

      def reject
        run_id = params.require(:id)
        @run = Run.find(run_id)
        authorize(@run, :reject?)

        if @run.status != 'pending'
          return render json: { error: 'Run cannot be rejected' }, status: :bad_request
        end

        reject_reason = params.require(:reject_reason)
        reject_description = params[:reject_description]
        @run.reject_and_cleanup(reject_reason, reject_description)
        if @run.save
          # reindex is required to update run fields
          @run.reindex(mode: :inline, refresh: :wait_for)
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      def feedback
        run_id = params.require(:id)
        @run = Run.find(run_id)
        authorize(@run, :feedback?)

        success = params.require(:success)
        success_notes = params[:success_notes]
        @run.success = success
        @run.success_notes = success_notes
        if @run.save
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      def abort
        run_id = params.require(:id)
        @run = Run.find(run_id)
        authorize(@run, :abort?)
        aborted_reason = params[:aborted_reason]
        @run.abort_and_cleanup aborted_reason
        if @run.save
          @run.reindex(mode: :inline, refresh: :wait_for)
          render json: @run.as_json(Run.flat_json)
        else
          render json: @run.errors
        end
      end

      private

      def serialize_run(run, includes, fields = {})
        resource = Api::V1::RunResource.new(run, context)
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::RunResource, include: includes, fields: fields)
        serializer.serialize_to_hash(resource)
      end

      def transfer_run(run, project_id)
        project = Project.find_by_id(project_id)
        if project.nil?
          return run.errors[:project] << "Can not find project #{project_id}"
        end

        # only allow runs to be transfered to a project owned by
        # the same organization
        if project.organization_id != run.project.organization_id
          run.errors.add(:project, "Can not transfer run to another organization." \
                                   " Project #{project.id} does not belong to organization" \
                                   " #{run.project.organization_id}.")
        end

        if project.bsl < run.project.bsl
          run.errors.add(:project, "Can not transfer a run from a bsl 2 project" \
                                   " to a bsl 1 project.")
        end

        if run.errors.empty?
          run.project = project
        end
      end

      def fields
        fields_hash = params.permit(fields: {}).to_h.fetch(:fields, {})
        Hash[fields_hash.symbolize_keys.map { |key, value| [ key, value.split(',').map { |s| s.to_sym } ] }]
      end
    end
  end
end
