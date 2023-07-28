class RunsController < UserBaseController
  before_action :find_context, except: [ :complete_warp, :preview, :create_preview ]
  before_action :find_project_context, except: [ :index, :complete_warp, :analyze, :preview, :create_preview,
                                                :group_submit, :show_json, :autoprotocol_json, :clone_json,
                                                :show_workcell ]

  before_action :set_run, only: [ :cancel, :accept, :bill, :start, :complete, :abort ]

  respond_to :json
  DARPA_SD2_ORG_ID = 'org1amxh23ednpz'

  def index
    runs = @project ? @project.runs : @container.runs

    if (params[:status])
      runs = runs.where(status: params[:status])
    end

    offset = params[:offset] || 0
    limit = params[:limit] || nil

    json_type =
      if params[:json_type] == 'short_json'
        Run.short_json
      elsif params[:json_type] == 'flat_json'
        Run.flat_json
      else
        Run.full_json
      end

    render json: runs.offset(offset).limit(limit).as_json(json_type)
  end

  def show
    respond_to do |format|
      format.embed do
        @run = @project.runs.find(params.require(:id))
        authorize(@run, :show?)

        render_react_app
      end
      format.json do
        @run = @project.runs.includes(instructions: [ :warps, :dataset ]).find(params.require(:id))
        authorize(@run, :show?)

        # Include request field for the `old` custom protocols
        # or if it is specifically request with the `include_request` param.
        #
        # The `old` UI views are generated from the request and have no instructions.
        json_format = Run.full_json
        if params[:include_request] || (@run.request_type != 'protocol')
          json_format[:only] << :request
        end

        render json: @run.as_json(json_format)
      end
    end
  end

  def show_json
    run = Run.find(params.require(:id))
    authorize(run, :show?)
    render json: run.as_json(Run.full_json)
  end

  def autoprotocol_json
    run = Run.find(params.require(:id))
    authorize(run, :show?)
    render json: run.request_autoprotocol
  end

  def clone_json
    run = Run.find(params.require(:id))

    authorize(run, :clone?)

    protocol        = Protocol.find(run.protocol_id)
    containers      = run.containers
    container_types = ContainerType.where(id: containers.pluck(:container_type_id))
    aliquots        = Aliquot.where(container_id: containers)
    custom_properties = ContextualCustomProperty.find_by_context_id(run.id)

    render json: {
      run: run.as_json(Run.flat_json),
      project: run.project.as_json(Project.flat_json),
      launch_request: run.launch_request,
      protocol: protocol.as_json(Protocol.flat_json),
      containers: containers.as_json(Container.flat_json),
      container_types: container_types.as_json(ContainerType.flat_json),
      aliquots: aliquots.as_json(Aliquot.flat_json),
      custom_properties: custom_properties.as_json(ContextualCustomProperty.flat_json)
    }
  end

  def show_workcell
    run = Run.find(params.require(:id))
    authorize(run, :show?)

    device_set = TCLE_SERVICE.universal_device_set

    if device_set.nil?
      message = '[TCLE] Device Set response was empty'

      Bugsnag.notify(message, severity: 'warning', run_id: run.id)
      return render json: { error: message }, status: :internal_server_error
    end

    # can't create workcell json when container has been deleted.
    refs = run.refs
    refs.each do |ref|
      if ref.container_id.nil?
        return render(json: [ "Ref #{ref.name} is missing container." ], status: :unprocessable_entity)
      end
    end

    # fake-reserve some tiso slots
    reservations = ReservationManager.fake_reservations(refs, run.instructions, device_set)

    # convert to workcell json
    workcell_json = run.to_workcell_json(reservations, fake_provision_sources: true)

    # Checks for workcell_json errors like using a retired container type, prevents sending json to TCLE
    # because this will cause errors on their end.
    error_str = Run.validate_workcell_json(workcell_json)

    if error_str
      render json: [ error_str ], status: :unprocessable_entity
    else
      render json: workcell_json
    end
  end

  def show_minimal
    respond_to do |format|
      @run = @project.runs.find(params.require(:id))

      format.json do
        authorize(@run, :show?)

        json_format = Run.minimal_json
        render json: @run.as_json(json_format)
      end
    end
  end

  def workcell_json
    run = @project.runs.find(params.require(:id))
    authorize(run, :show?)

    device_set = TCLE_SERVICE.universal_device_set

    if device_set.nil?
      message = '[TCLE] Device Set response was empty'

      Bugsnag.notify(message, severity: 'warning', run_id: run.id)
      return render json: { error: message }, status: :internal_server_error
    end

    # can't create workcell json when container has been deleted.
    refs = run.refs
    refs.each do |ref|
      if ref.container_id.nil?
        return render(json: [ "Ref #{ref.name} is missing container." ], status: :unprocessable_entity)
      end
    end

    # fake-reserve some tiso slots
    reservations = ReservationManager.fake_reservations(refs, run.instructions, device_set)

    # convert to workcell json
    workcell_json = run.to_workcell_json(reservations, fake_provision_sources: true)

    # Checks for workcell_json errors like using a retired container type, prevents sending json to TCLE
    # because this will cause errors on their end.
    error_str = Run.validate_workcell_json(workcell_json)

    if error_str
      render json: [ error_str ], status: :unprocessable_entity
    else
      render json: workcell_json
    end
  end

  def autoprotocol
    run = @project.runs.find(params.require(:id))
    authorize(run, :show?)

    render json: run.request_autoprotocol
  end

  def create
    org = @project.organization

    # whitelisting admins if the organization is internal
    unless current_admin && org[:test_account]
      authenticate_user!
    end

    authorize(@project, :create_run?)

    launch_request_id = params[:launch_request_id]
    custom_properties = params[:custom_properties]
    protocol          = params[:protocol].try(:to_unsafe_h)
    lab_id             = params[:lab_id] || nil
    predecessor_id    = params[:predecessor_id] || nil
    batch_id          = params[:batch_id] || nil
    requested_at = if ((@organization.feature_groups.include? 'ccs_org') && !params[:request_date].nil?)
                     params[:request_date]
                  else
                    nil
                  end

    estimated_run_time = if launch_request_id
                           LaunchRequest.find(launch_request_id).autoprotocol["estimated_run_time"]
                        else
                          nil
                        end

    run                   = Run.new
    run.project           = @project
    run.owner             = current_user
    run.test_mode         = (params[:test_mode] || session[:test_mode]).present?
    run.properties        = params[:properties].to_unsafe_h if params[:properties]
    run.launch_request_id = launch_request_id
    run.bsl               = run.project.bsl
    run.requested_at      = requested_at
    run.estimated_run_time_cache = estimated_run_time
    run.predecessor_id    = predecessor_id

    if lab_id
      lab = Lab.find(lab_id)
      authorize(lab, :show?)
      run.lab = lab
    else
      run.lab = org.labs.first
    end

    should_create_invoice_item = !(run.test_mode || org.test_account || run.is_implementation?)

    if batch_id.present?
      begin
        batch_scope = Pundit.policy_scope!(pundit_user, Batch)
        batch = batch_scope.find(batch_id)
        run.batch = batch
      rescue ActiveRecord::RecordNotFound
        return render json: { errors: [ "Batch with id '#{batch_id}' does not exist" ] }, status: :not_found
      end
    end

    if !(launch_request_id.nil? ^ protocol.nil?)
      return render json: {
        errors: [ "A run must either have a launch request, or directly supply autoprotocol." ]
      }, status: :bad_request
    end

    # payment method id required
    payment_method_id =
      params.permit(:payment_method_id)[:payment_method_id] ||
      @project.payment_method_id ||
      org.default_payment_method_id

    payment_method = PaymentMethod.find_by(id: payment_method_id,
                                           organization_id: org.id)

    if should_create_invoice_item && payment_method.nil?
      return render json: {
        errors: [ "A run must specify a valid payment_method_id" ]
      }, status: :payment_required
    end

    if launch_request_id
      launch_request = LaunchRequest.find(launch_request_id)
      authorize(launch_request, :show?)

      if not launch_request.validated_at
        return render json: {
          errors: [ "Invalid Launch Request: #{launch_request_id}" ].concat(launch_request.generation_errors)
        }, status: :bad_request
      end

      run.protocol_id = launch_request.protocol_id
      run.protocol    = launch_request.autoprotocol
    else
      authorize(Run, :create_with_autoprotocol?)

      run.protocol_id = params[:protocol_id] if params[:protocol_id]
      run.protocol    = protocol
    end

    if params[:title]
      run.title = params[:title]
    elsif run.protocol_id
      run.title = Protocol.find(run.protocol_id).display_name
    end

    unless run.errors.empty?
      return render json: run.errors, status: :bad_request
    end

    contextual_custom_properties = []

    if custom_properties.present?
      custom_properties.each do |obj|
        contextual_custom_property = ContextualCustomProperty.new
        contextual_custom_property.context = run
        contextual_custom_property.contextual_custom_properties_config =
              ContextualCustomPropertiesConfig.find_by_key_and_organization_id_and_context_type(
                obj["key"], org.id, 'Run')
        contextual_custom_property.value = obj["value"]
        unless contextual_custom_property.errors.empty?
          return render json: contextual_custom_property.errors, status: :unprocessable_entity
        end
        contextual_custom_properties.push(contextual_custom_property)
      end
    end

    # Determine whether the run is internal based on organization's test_account field
    run.internal_run = true if org.test_account

    ActiveRecord::Base.transaction do
      run.save

      if contextual_custom_properties.present?
        contextual_custom_properties.each do |ccp|
          ccp.save
        end
      end

      # TODO: If we link more resources to execution id, handle this generally in
      # an after_action rails hook
      execution_id = request.headers["Execution-Id"]
      if execution_id
        ExecutionRes.create(execution_id: execution_id, run_id: run.id)
      end

      if run.errors.empty?
        quote                   = Run.internal_quote(run)
        run.total_cost_internal = quote['internal_total']
        run.total_cost_ppp      = quote['ppp_total']
        Run.remove_internal_items(quote)
        run.quote = quote

        run.save

        if should_create_invoice_item
          quote['items'].each do |item|

            netsuite_item_id = if org.id == DARPA_SD2_ORG_ID
                                 InvoiceItem::NETSUITE_ACCOUNT_EXECUTION_SD2
                               else
                                 InvoiceItem::NETSUITE_ACCOUNT_CLOUD_LAB_BIOLOGY
                               end

            InvoiceManager.add_charge("Run #{run.id}: #{item['title']}",
                                      item['cost'].to_f,
                                      payment_method_id,
                                      quantity: item['quantity'].to_i,
                                      run_id: item['run_id'],
                                      run_credit_applicable: item['run_credit_applicable'],
                                      netsuite_item_id: netsuite_item_id,
                                      autocredit: true,
                                      delay_invoice: true)
          end
        end
      end
    end

    # Reindex the run in-line, as we expect it to immediately appear in the run queue
    run.reindex(mode: :inline)

    if !run.errors.empty?
      return render json: run.errors, status: :unprocessable_entity
    end

    #
    # Create program executions if the protocol calls for it
    #
    protocol = Protocol.find_by_id(run.protocol_id)
    if !protocol.nil?
      program_id = protocol.program_id
      if !program_id.nil?
        ProgramExecution.create(
          program_id: program_id,
          run_id: run.id,
          user_id: current_user.id
        )
      end

      # If specified, attach a program to each data generating inst
      per_inst_program_id = protocol.per_inst_program_id
      if !per_inst_program_id.nil?
        run.instructions.where.not(data_name: nil).each do |inst|
          ProgramExecution.create(
            program_id: per_inst_program_id,
            instruction: inst,
            user_id: current_user.id
          )
        end
      end
    end

    # It is important that we call the NOTIFICATION_SERVICE outside of the
    # DB transaction so that the transaction commits and a run
    # exists when the mailer executes.
    NOTIFICATION_SERVICE.run_created(run) unless run.test_mode || run.is_implementation?
    TestScheduleJob.perform_async(run.id)

    render json: run.as_json(Run.full_json),
           status: :created,
           location: organization_project_run_path(@organization.subdomain, @project.id, run)
  end

  def start
    authorize(@run, :authorized_in_lab?)
    transition success: 'Run was started.', failure: 'Run could not be started.' do
      @run.start
    end
  end

  def complete
    authorize(@run, :authorized_in_lab?)
    transition success: 'Run was completed.', failure: 'Run could not be completed.' do
      @run.complete
    end
  end

  def cancel
    authorize(@run, :update?)
    details = params[:details]
    transition success: 'Run was canceled.', failure: "Run could not be canceled. #{@run.errors}" do
      @run.cancel_and_cleanup details
      @run
    end
  end

  def abort
    authorize(@run, :abort?)
    details = params[:details]
    transition success: 'Run was aborted.', failure: 'Run could not be aborted.' do
      @run.abort_and_cleanup details
      @run
    end
  end

  def bill
    authorize(@run, :can_manage_global_invoices?)
    transition success: 'Run was billed.', failure: 'Run could not be billed.' do
      if params[:manual]
        @run.bill_manually
      else
        @run.bill
      end
    end
  end

  def update
    @run = Run.find(params.require(:id))

    authorize(@run, :update?)

    # use unsafe_h as so many parameters are unknown keyed hashes (quote, request, etc)
    safe_attrs = params.require(:run)
                       .to_unsafe_h
                       .slice(:internal_run, :quote, :request, :draft_quote,
                              :properties, :status, :title, :success, :success_notes,
                              :predecessor_id)

    if safe_attrs[:quote] or safe_attrs[:draft_quote] or !safe_attrs[:internal_run].nil?
      authorize(@run, :can_manage_global_invoices?)
    end

    if safe_attrs[:internal_run] == true && @run.internal_run == false
      render json: { errors: [ "Cannot switch external runs to internal" ] }, status: :bad_request
      return
    end

    if safe_attrs[:request]
      if @run.closed?
        render json: { status: "is closed" }, status: :unprocessable_entity
        return
      end
      if @run.in_progress?
        render json: { status: "is in progress" }, status: :unprocessable_entity
        return
      end
    end
    if safe_attrs[:quote]
      if @run.closed?
        render json: { status: "is closed" }, status: :unprocessable_entity
        return
      end
    end

    @run.attributes = safe_attrs

    if safe_attrs[:request]
      @run.status = :pending
    end

    if @run.save
      render json: @run.as_json(Run.full_json)
    else
      render json: @run.errors
    end
  end

  def analyze
    authorize(@organization, :member?)

    run_id            = params[:run_id]
    launch_request_id = params[:launch_request_id]
    protocol          = params[:protocol]
    bsl               = params[:bsl] || 1
    test_mode         = (params[:test_mode] || session[:test_mode]).present?

    if !(run_id.present? ^ launch_request_id.present? ^ protocol.present?)
      return render json: {
        errors: [ "Must either have a run, a launch request, or directly supply autoprotocol." ]
      }, status: :bad_request
    end

    run           = Run.new
    run.project   = @organization.projects.build
    run.bsl       = bsl
    run.owner     = current_user
    run.test_mode = test_mode

    if run_id
      run = Run.find(run_id)
      authorize(run, :show?)
    elsif launch_request_id

      launch_request = LaunchRequest.find(launch_request_id)
      org = launch_request.organization || @organization

      authorize(launch_request, :show?)

      if not launch_request.validated_at
        return render json: {
          errors: [ "Invalid Launch Request: #{launch_request_id}" ].concat(launch_request.generation_errors)
        }, status: :bad_request
      end

      run = Run.new({
        project: org.projects.build,
        bsl: bsl,
        owner: current_user,
        test_mode: test_mode,
        protocol_id: launch_request.protocol_id,
        ## TODO Below line need to be revisited. We must have lab association to launch_request as well.
        ## That way we can read from `launch_request.lab` instead of `@organization.labs.first`
        ## If `lab` information is provided in request, we should still honor from launch request as generated protocol
        # is validated in the context of that lab.
        lab: org.labs.first,
        estimated_run_time_cache: launch_request.autoprotocol["estimated_run_time"]
      })

      run.protocol = launch_request.autoprotocol
    else
      run = Run.new({
        project: @organization.projects.build,
        bsl: bsl,
        owner: current_user,
        test_mode: test_mode,
        # If user is submitting protocol directly to analyze, then we can use the first lab of organization.
        # This assumption of first lab is fine until we start supporting multi-lab association to organization.
        # When we start supporting multi-lab, then request must include lab_id as well.
        lab: @organization.labs.first
      })

      run.protocol = protocol.to_unsafe_h
    end

    # fail early
    if !run.errors[:protocol].empty?
      return render json: run.errors, status: :unprocessable_entity
    end

    run.quote =
      if authorized?(Run, :view_internal_quote_items?)
        Run.internal_quote(run)
      else
        Run.external_quote(run)
      end

    render json: run.as_json(Run.full_json)
  end

  # If user has an issue with the run they can flag it
  def mark_flagged
    run = @project.runs.find(params[:id])
    authorize(run, :update?)
    run.flagged = true
    if run.save!
      render json: run.as_json(Run.short_json)
    else
      render json: run.errors, status: unprocessable_entity
    end
  end

  def complete_all_instructions
    run = @project.runs.find(params[:id])
    if !run.test_mode
      return render json: { error: 'You can only execute test mode runs.' }, status: :unprocessable_entity
    end
    authorize(run, :update?)
    run.start!

    ExecuteRunJob.perform_async(run.id)

    head :ok
  end

  def data
    run = @project.runs.find(params[:id])
    authorize(run, :show?)

    respond_to do |format|
      format.json do
        if params[:ref_name]
          ins = run.instructions.find_by_data_name!(params[:ref_name])
          dataset = ins.dataset
          if ins.dataset
            path = organization_project_dataset_path(@organization,
                                                     @project.id,
                                                     dataset.id,
                                                     format: params[:format])

            redirect_to path
          else
            render json: {}
          end
          return
        end

        render json: run.all_data.map { |k, v|
          [ k, v && { sequence_no: v.instruction.sequence_no }.update(v.as_json) ]
        }.to_h
      end
      format.zip do
        buf = Zip::Archive.open_buffer(Zip::CREATE) do |ar|
          run.all_data.each do |k, v|
            next unless v
            csv = v.to_csv
            if csv && csv != ""
              ar.add_buffer("#{k}.csv", csv)
            else
              ar.add_buffer("#{k}.json", v.to_json)
            end
          end
        end
        filename =
          if run.title
            "#{run.title} (#{run.id}).zip"
          else
            "#{run.id}.zip"
          end
        headers['content-disposition'] = "attachment; filename=" + filename.to_json
        self.response_body = buf
      end
      format.any do
        # SUPER HACK
        # For some reason refreshing dataref pages that have names that container crazy characters.
        #
        #   Example: "B3GNT2|v0.0.6|2018-02-01|assay_plate_1_activity|100 mM 6252"
        #
        # The Rails request.format will be up type `Mime::NullType.instance` as none will be found.
        # This means that the React APP route will not match as that requires the format be html.
        #
        # For the time being we will add an `any` handler to render the react app.
        #
        # The webpack dev server does NOT have this problem.
        #
        # For the life of me, I could not figure out where rails calculates format and why it was failing.
        render_react_app
      end
    end
  end

  def clone
    run = Run.find(params.require(:id))

    authorize(run, :clone?)

    protocol        = Protocol.find(run.protocol_id)
    containers      = run.containers
    container_types = ContainerType.where(id: containers.pluck(:container_type_id))
    aliquots        = Aliquot.where(container_id: containers)
    custom_properties = ContextualCustomProperty.find_by_context_id(run.id)

    render json: {
      run: run.as_json(Run.flat_json),
      project: run.project.as_json(Project.flat_json),
      launch_request: run.launch_request,
      protocol: protocol.as_json(Protocol.flat_json),
      containers: containers.as_json(Container.flat_json),
      container_types: container_types.as_json(ContainerType.flat_json),
      aliquots: aliquots.as_json(Aliquot.flat_json),
      custom_properties: custom_properties.as_json(ContextualCustomProperty.flat_json)
    }
  end

  def quote
    @run = @project.runs.find(params[:id])
    authorize(@run, :show?)
    render json: @run.quote
  end

  def refs
    @run = @project.runs.find(params[:id])
    authorize(@run, :show?)
    respond_to do |format|
      format.json do
        render json: @run.referenced_containers
      end
      # Like mentioned in the data method, refs can have odd names containing, for example, periods (".")
      #
      # Example: run/<run_id>/refs/my.special.container
      #
      # These periods are interpreted as an extension (i.e. MIME type) delimiter, which confuses Rails MIME
      # determination and, as a result, evades the react app catch-all route, as it results in a nil format.
      #
      # So, when we receive this type of request, we manually inspect the accept-headers to determine the desired
      # response content type. If it's 'text/html', as in the case from a browser request, we render the react app.
      # Otherwise, we return json, which is the default behavior of our controllers.
      format.all do
        if request.headers['HTTP_ACCEPT'].split(',').include?('text/html')
          render_react_app
        else
          render json: @run.referenced_containers, content_type: 'application/json'
        end
      end
    end
  end

  def dependencies
    @run = @project.runs.find(params[:id])
    authorize(@run, :show?)
    render json: {
      unrealized_input_containers: @run.unrealized_input_containers.map(&:id),
      dependents: @run.dependents.map(&:id)
    }
  end

  def create_preview
    authorize(Run, :create_with_autoprotocol?)

    key = SecureRandom.uuid
    REDIS_CLIENT.set(key, params[:protocol].to_json)
    REDIS_CLIENT.expire(key, 60 * 60 * 2)

    render json: { key: key }
  end

  def preview
    authorize(Run, :create_with_autoprotocol?)

    key  = params.require(:key)
    data = REDIS_CLIENT.get(key)

    respond_to do |format|
      format.embed do
        render_react_app
      end
      format.all do
        if data.nil?
          return render json: { errors: [ "Preview missing or expired: #{key}" ] }, status: :not_found
        end

        begin
          protocol = JSON.parse(data)
        rescue JSON::ParserError => e
          return render json: { errors: [ "Bad Json: #{e.message}" ] }, status: :bad_request
        end

        run          = Run.new
        run.owner    = current_user
        run.protocol = protocol

        unless run.errors.empty?
          return render json: run.errors, status: :bad_request
        end

        json_format = Run.full_json

        # This 'preview' run doesn't have a project or an organization
        # making it impossible to calculate billing.
        # TODO: make the json formatting more composable.
        json_format[:methods] = json_format[:methods].reject { |m| m == :billing_valid? }

        if params[:include_request] || (run.request_type != 'protocol')
          json_format[:only] << :request
        end

        render json: run.as_json(json_format)
      end
    end
  end

  def validate_run(run, user)
    if run.closed?
      return false, "Run #{run.id} cannot be sent to the workcell, bad status: '#{run.status}'"
    end

    if run.test_mode
      return false, "Run #{run.id} is in test_mode"
    end

    # if this is a new run make sure it can be started
    # (could be partial run for a run that has already started)
    if run.started_at.nil? && !run.can_start?
      return false, "Run #{run.id} cannot be started yet"
    end

    if !current_admin.nil?
      run.sent_to_workcell_by = user
    else
      run.sent_to_workcell_by_user = user
    end

    return run.save, "Unable to save run #{run}"
  end

  def send_to_workcell
    run                        = @project.runs.find(params.require(:id))
    workcell_id                = params.require(:workcell)
    session_id                 = params.fetch(:session_id, nil)
    reserve_destinies          = params.fetch(:reserve_destinies, false)
    is_test_submission         = params.require(:is_test_submission)
    user                       = current_user || current_admin

    if !is_test_submission and params.require(:time_constraints_are_suggestions)
      error_msg = "Time constraints cannot be suggested for workcell #{workcell_id}"
      return render(json: { error: error_msg }, status: :bad_request)
    end

    authorize(run, :robots?)

    if is_test_submission
      # these two states imply that we might have destroyed containers, making workcell json fail.
      if [ "aborted", "canceled" ].include?(run.status)
        error_msg = "Run cannot be sent to the workcell, bad status: '#{run.status}'"
        return render(json: { error: error_msg }, status: :bad_request)
      end
    else
      success, error_msg = validate_run(run, user)
      if !success
        return render(json: { error: error_msg }, status: :bad_request)
      end
    end

    # subset if requested
    partial_run =
      if params[:subrun]
        run.partial_run(params[:subrun][:instruction_idxs])
      else
        run
      end

    human_seqs = params.fetch(:x_human, []).to_set

    human_insts, robot_insts = partial_run.instructions.partition do |inst|
      human_seqs.include?(inst.sequence_no)
    end

    workcell = Workcell.find_by_workcell_id(workcell_id)

    if is_test_submission
      reservations = {}
      run_json     = partial_run.to_workcell_json(reservations)
    elsif workcell&.workcell_type == INTEGRATION_TYPE
      run_json = run.to_workcell_json(reservations)
      invalid_container_ids = containers_with_nil_barcode(run_json[:containerData])
      if invalid_container_ids&.present?
        error_str = "Cannot generate artifacts for #{workcell.name} because containers #{invalid_container_ids} "\
                    "does not have barcode"
        return render json: [ error_str ], status: :unprocessable_entity
      end
      if params[:subrun] && (run.instructions.map(&:sequence_no) - params[:subrun][:instruction_idxs]).present?
        error_str = "submission of subset of instructions not allowed for #{INTEGRATION_TYPE} type"
        return render json: [ error_str ], status: :unprocessable_entity
      end
      resp = process_integration_workcell(run, user, @organization)
      send_data Base64.encode64(resp.body), :disposition => 'attachment',
                :filename =>  resp['Content-Disposition'].split('filename=')[1]
      return
    else
      # reserve tiso slots on desired workcell
      workcell = Location.where_location_category('workcell')
                         .find_by(name: workcell_id)

      # run execution
      run_ex = RunExecution.create(run_id: run.id,
                                   instruction_ids: partial_run.instructions.map(&:id),
                                   workcell_id: workcell_id,
                                   submitted_by_admin_id: user.id)

      # reserve tisos, but only for robot instructions.
      reservations, rerrors = ReservationManager.reserve_tisos(run_ex,
                                                               partial_run.refs,
                                                               robot_insts,
                                                               workcell,
                                                               user,
                                                               @organization,
                                                               reserve_destinies: reserve_destinies)
      if !rerrors.empty?
        # clear reservations if there is a reservation error
        ReservationManager.clear_run_execution(run_ex.id)
        return render json: { errors: rerrors }, status: :bad_request
      end

      # require force flag to ignore warnings and continue
      # currently, there can only be time constraint warnings for partial runs
      if !params[:force] && partial_run.partial_time_constraints_warnings

        warnings = {
          time_constraint: partial_run.partial_time_constraints_warnings
        }

        ReservationManager.clear_run_execution(run_ex.id)
        return render json: { warnings: warnings }, status: :unprocessable_entity
      end

      recent_request = run.recent_request

      # require force flag to ignore warnings and continue
      # warning that the run was scheduled recently
      if !params[:force] && recent_request

        warnings = {
          recently_scheduled: recent_request.created_at
        }

        ReservationManager.clear_run_execution(run_ex.id)
        return render json: { warnings: warnings }, status: :unprocessable_entity
      end

      # convert to workcell json
      run_json = partial_run.to_workcell_json(reservations, reserve_destinies: reserve_destinies)

      # Use run_execution TCLE id
      run_json[:run_id] = run_ex.tcle_id
    end
    # Checks for workcell_json errors like using a retired container type, prevents sending json to TCLE
    # because this will cause errors on their end.
    error_str = Run.validate_workcell_json(run_json)

    if error_str
      return render json: [ error_str ], status: :unprocessable_entity
    end

    # update run_json human instructions
    run_json = workcell_json_mark_x_human(run_json, human_insts)

    #
    # Production request: QueueRunRequest:
    # {
    #   "run": <run>,
    #   "maxScheduleTime": <time>,
    #   "checkContainerTypeAvailability": <boolean>, # default: true
    #   "partitionGroupSize": <optional: integer>,   # unused at Strateos
    #   "partitionHorizon": <optional: time>,        # unused at Strateos
    #   "partitionSwapDeviceId": <optional: string>, # unused at Strateos
    #   "autoAccept": <boolean>,                     # default: false
    #   "cplexSeed": <optional: Int>,
    #   "requestId": <option: string>
    # }
    #
    # Test request: QueueTestRequest:
    # {
    #   "run": <run>,
    #   "sesionId": <optional: string>,     | exactly one of those three
    #   "deviceSet": <optional: deviceset>, | parameters need to be set
    #   "mcxId": <optional: string>,        |
    #   "maxScheduleTime": <time>,
    #   "scheduleAt": <optional: instant>,
    #   "timeConstrainsAreSuggestions": <boolean>,   # default: false
    #   "checkContainerTypeAvailability": <boolean>, # default: true
    #   "partitionGroupSize": <optional: integer>,   # unused at Strateos
    #   "partitionHorizon": <optional: time>,        # unused at Strateos
    #   "partitionSwapDeviceId": <optional: string>, # unused at Strateos
    #   "cplexSeed": <optional: Int>,
    #   "requestId": <option: string>
    # }
    #

    request = {
      run: run_json,
      maxScheduleTime: params[:max_schedule_time],
      checkContainerTypeAvailability: true, # todo add as argument?
    }

    if is_test_submission
      if session_id.nil?
        workcell = Workcell.find_by_workcell_id(workcell_id)
        # Will set Nil if Workcell is from AMS (non ActiveRecord) since workcell entity in AMS doesn't
        # contain node_id field
        request[:mcxId] = workcell&.node_id
      else
        request[:sessionId] = session_id
      end
      request[:isTest] = true # used only in web
      request[:timeConstraintsAreSuggestions] = params[:time_constraints_are_suggestions]
      schedule_delay = 0.seconds
    else
      schedule_delay = ScheduleRequest::SCHEDULE_DELAY
    end

    schedule_request = ScheduleRequest.create(
      workcell_id: workcell_id,
      request: request,
      run: run,
      status: 'new'
    )

    if params[:service_url]
      schedule_request.create_schedule_job(schedule_delay, params[:service_url])
    else
      # Create the schedule job to send the request to TCLE
      schedule_request.create_schedule_job(schedule_delay)
    end

    render json: {
      schedule_request: schedule_request,
      schedule_delay: schedule_delay
    }
  end

  def workcell_json_mark_x_human(run_json, human_insts)
    human_insts.each do |instruction|
      ins_json = run_json[:instructions].find { |i| i[:id] == instruction.id }
      # group submit passes in all human_instructions for group request, make sure we have the run available on the json
      if ins_json
        ins_json[:operation][:x_human] = true
      end
    end
    run_json
  end

  def group_submit
    run_ids       = params.require(:run_ids)
    workcell_id   = params.require(:workcell_id)
    aggregateRuns = params.fetch(:aggregateRuns, false)
    user          = current_user || current_admin

    # verify at least one run is submitted
    if run_ids.empty?
      return render json: {
        errors: [ "Must have at least one run for run group submit request" ]
      }, status: :bad_request
    end

    # verify metamcx workcell type
    workcell = Workcell.find_by_workcell_id(workcell_id)
    if workcell.nil?
      return render json: {
        errors: [ "Workcell #{workcell_id} does not exist" ]
      }, status: :not_found
    end
    if workcell.workcell_type != METAMCX_TYPE
      return render json: {
        errors: [ "Workcell type must be metamcx for a queueRunGroup request" ]
      }, status: :bad_request
    end

    # [[partial_run, original run]]
    # Must return both the partial run with only uncompleted instructions
    # as well as original run for use in ScheduleRequest
    runs = run_ids.map do |run_id|
      begin
        run = Run.find(run_id)
        authorize(run, :execute_programs?)
        success, error_msg = validate_run(run, user)
        if !success
          return render(json: { error: error_msg }, status: :bad_request)
        end
        uncompleted_instruction_nbrs = run.instructions.where(completed_at: nil).map(&:sequence_no)
        [ run.partial_run(uncompleted_instruction_nbrs), run ]
      rescue ActiveRecord::RecordNotFound => _e
        return render json: {
          errors: [ "Run id #{run_id} not found for run group submit request" ]
        }, status: :not_found
      end
    end

    # create run execution
    runs.each do |uncompleted_run, original_run|
      RunExecution.create(run_id: uncompleted_run.id,
                          instruction_ids: uncompleted_run.instructions.map(&:id),
                          workcell_id: workcell_id,
                          submitted_by_admin_id: user.id)
    end

    # Currently performed by front end, but already uses data from backend, saving trip
    human_insts = runs.flat_map do |uncompleted_run, original_run|
      uncompleted_run.instructions.select do |inst|
        !inst.operation&[ :x_human ].nil? ?
          inst.operation[:x_human] :
          inst.is_human_by_default
      end
    end

    # convert runs to workcell json
    runs_workcell_json = runs.map do |uncompleted_run, original_run|
      workcell_json = uncompleted_run.to_workcell_json({})
      error_str = Run.validate_workcell_json(workcell_json)
      if error_str
        return render json: [ error_str ], status: :unprocessable_entity
      end
      workcell_json
    end

    # update workcell json human instructions
    runs_workcell_json = runs_workcell_json.map do |run_json|
      workcell_json_mark_x_human(run_json, human_insts)
    end

    # create schedule request
    schedule_requests = runs.map.with_index do |pair, index|
      original_run = pair[1]
      ScheduleRequest.create(
        workcell_id: workcell_id,
        request: runs_workcell_json[index], # store only the corresponding workcell json
        run: original_run,
        status: "processing"
      )
    end

    # forward request to lab
    ScheduleJob.perform_async(workcell_id, runs_workcell_json, schedule_requests.map(&:id), aggregateRuns)

    render json: {
      schedule_requests: schedule_requests.as_json(ScheduleRequest.response_json)
    }
  end

  # TODO: This should be in admin scope
  def abort_schedule_request
    run = @project.runs.find(params[:id])
    authorize(run, :robots?)
    srid = params.require(:srid)
    req = run.schedule_requests.find(srid)

    if req.processing?
      render json: { error: "Schedule job has already started" }, status: :conflict
    else
      req.abort!
      render json: req
    end
  end

  # TODO: This should be in admin scope
  def get_schedule_request
    run = @project.runs.find(params[:id])
    authorize(run, :robots?)
    srid = params.require(:srid)
    req = run.schedule_requests.find(srid)
    render json: req
  end

  def warps
    run = @project.runs.find(params[:id])
    authorize(run, :show?)
    render json: Warp.where(run_id: run.id).includes(:warp_events).as_json(include: [ :warp_events ])
  end

  private

  def transition(_opts)
    if yield
      head :ok
    else
      render json: @run.errors, status: :unprocessable_entity
    end
  end

  def containers_with_nil_barcode(containers)
    invalid_containers = containers&.select { |c_id, container| container[:barcode].nil? }
    invalid_containers&.keys
  end

  def process_integration_workcell(run, user, organization)
    run.mark_instructions_as_started
    run_hash = Run.includes(instructions: [ :warps, :generated_containers ],
                            refs: [
                              container: [ :container_type, :organization, :minimal_aliquots, :device,
                                           { location: [ :location_type ] } ],
                              orderable_material_component: [ :container_type, :resource ]
                            ]).find(run.id).as_json(
                              {
                                only: [],
                                include: {
                                  refs: Ref.full_json,
                                  instructions: Instruction::SHORT_JSON
                                },
                                methods: []
                              }
                            )
    automation_control_request = {}
    automation_control_request[:id] = run.id
    automation_control_request[:instructions] = run_hash["instructions"]
    automation_control_request[:refs] = run_hash["refs"]
    automation_control_request[:ownerOrg] = run.project.organization.subdomain
    AUTOMATION_CONTROL_ADAPTER_SERVICE.generate_artifacts(user, organization, TEMPO, automation_control_request)
  end

  def set_run
    @run = @project.runs.find(params[:id])
  end
end
