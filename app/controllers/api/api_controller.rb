module Api
  class ApiController < UserBaseController
    include JSONAPI::ActsAsResourceController

    # skip some filters
    skip_before_action :configure_permitted_parameters, if: :devise_controller?
    skip_before_action :check_client_version

    before_action :inject_default_fields, except: [ :v1_index ]

    def context
      { user_context: pundit_user, action: action_name, custom_params: params[:custom_params],
                      current_organization: @organization }
    end

    def render_api_exception(exception)
      errors = exception.errors.map do |error|
        error.source ||= self.request.fullpath
        error
      end
      render_errors(errors)
    end

    def render_error(title, status: :bad_request, code: '400', detail: nil, source: self.request.fullpath)
      err = JSONAPI::Error.new(code: code, status: status, title: title, detail: detail, source: source)
      render_errors([ err ])
    end

    # Exception handling
    rescue_from(ActiveRecord::RecordNotFound, with: :render_404_record_not_found)
    rescue_from(ActiveRecord::InvalidForeignKey, with: :render_invalid_foreign_key)
    rescue_from(JSONAPI::Exceptions::Error, with: :render_jsonapi_error)
    rescue_from(Pundit::NotAuthorizedError, with: :render_pundit_error)
    rescue_from(AccessControlServiceError, with: :render_acs_error)
    rescue_from(ProgramExecutionException, with: :render_400_bad_request)

    def render_404_record_not_found(exception)
      e = JSONAPI::Exceptions::RecordNotFound.new(exception.id)
      render_api_exception(e)
    end

    def render_acs_error(error)
      render_error(error.message, code: error.code, status: :unprocessable_entity,
                   detail: error.description, source: self.request.fullpath)
    end

    def render_invalid_foreign_key
      message = "Foreign Key Not Found"
      render_error(message, detail: message, source: self.request.fullpath)
    end

    def render_jsonapi_error(error)
      render_api_exception(error)
    end

    def render_pundit_error(error)
      id       = error.record.try(:id)
      resource = error.policy.class.to_s.gsub('Policy', '')
      method   = error.query.to_s.delete('?')

      error_message = "Not Authorized to #{method} #{resource}"
      error_message << ": #{id}" if id

      Rails.logger.error error_message

      e = NotAuthorized.new("User not authorized to perform this action")
      render_api_exception(e)
    end

    def render_400_bad_request(exception)
      render_error("Bad Request", detail: exception.message)
    end

    # JSONAPI Resources library serializes all `fetchable_fields` for a request.
    #
    # This means that if we want to expose an expensive field on a resource that by
    # default it will always be included and will slow down the request.
    #
    # Of course if a user specifically limits the fields requested then we might not incur this cost,
    # but we can't rely on user's to be explicit always.
    #
    # This method is a hack to manipulate the Rails request object and inject default fields for the resource
    # and its included resources.
    #
    #   https://github.com/cerebris/jsonapi-resources/issues/855
    def inject_default_fields
      params_has_data_and_data_is_not_array = params[:data] && !params[:data].is_a?(Array)

      # the request parser can mutate the params object so we clone here.
      data_id = params_has_data_and_data_is_not_array && params[:data][:id]

      # parse the request for validation. Will throw exception on error.
      # Sadly this means that we will be reparsing the request twice, another time after the injection of the fields.
      parser = JSONAPI::RequestParser.new(
        params,
        context: context,
        key_formatter: key_formatter,
        server_error_callbacks: (self.class.server_error_callbacks || [])
      )

      # traverse the include hash to find which resources will be fetched.
      resource        = parser.resource_klass
      directives_hash = parser.include_directives.try(:include_directives) || {}
      resources       = [ resource ] + extract_included_resources(resource, directives_hash)
      included_names  = extract_included_names(resource, directives_hash)

      # grab current values of fields
      fields = params.fetch(:fields, ActionController::Parameters.new({}))

      # inject default values if no fields are specified.
      resources.each do |r|
        next if fields.include?(r._type)

        default_attributes    = r.default_attributes()
        included_associations = included_names[r._type]
        all_fields            = default_attributes.concat(included_associations)

        if default_attributes.present?
          fields[r._type] = all_fields.map(&:to_s).join(',')
        end
      end

      # add mutated fields into params
      params[:fields] = fields

      params[:containers]

      # update method will delete the id from the data field
      # ideally we would clone the entire params and then readd it bac,
      # but that wasn't working.
      if data_id
        params[:data][:id] = data_id
      end
    end

    # Helper method to above inject_default_fields
    # Returns included resources.
    def extract_included_resources(parent_resource, directives_hash)
      related = directives_hash[:include_related]

      return [] if related.nil? || related.empty?

      related.flat_map { |association_name, child_directive_hash|
        begin
          resource = parent_resource._relationships[association_name].resource_klass
        rescue NoMethodError
          raise JSONAPI::Exceptions::InvalidInclude.new(parent_resource, association_name)
        end
        [ resource ] + extract_included_resources(resource, child_directive_hash)
      }.uniq
    end

    # Helper method to above inject_default_fields
    # Returns mapping from resource to included names.  We must include these names in the injected fields
    #
    # From the docs:
    # Note: When passing include and fields params together, relationships not included
    # in the fields parameter will not be serialized. This will have the side effect of
    # not serializing the included resources. To ensure the related resources are properly
    # side loaded specify them in the fields, like fields[posts]=comments,title&include=comments.
    def extract_included_names(parent_resource, directives_hash)
      results = { parent_resource._type => [] }
      related = directives_hash[:include_related]

      return results if related.nil? || related.empty?

      related.each do |association_name, child_directive_hash|
        # add association
        results[parent_resource._type].append(association_name)

        # add children associations
        resource      = parent_resource._relationships[association_name].resource_klass
        child_results = extract_included_names(resource, child_directive_hash)

        child_results.each do |typ, child_values|
          parent_values = results.fetch(typ, [])
          parent_values.concat(child_values)
          results[typ] = parent_values
        end
      end

      results
    end

    def error_leaf_msgs(errs)
      error_message = errs.map { |err| err[:message] }
      error_message
    end

    # validate json schema
    def validate_json(schema, data)
      errors = JSON::Validator.fully_validate(schema, data, errors_as_objects: true)

      if errors.empty?
        return true
      end

      # Traverses the tree of errors and captures the leafs message string.
      leaf_errors = []

      errors.each do |error|
        if error[:errors]
          error_hash = error[:errors]
          sub_errors = error_hash.values.map { |errs| error_leaf_msgs(errs) }
          leaf_errors.concat sub_errors.flatten
        else
          leaf_errors << error[:message]
        end
      end

      raise BadJSON.new(leaf_errors)
    end

    # Exception that allows custom message and 400 status
    class BadJSON < JSONAPI::Exceptions::Error
      attr_accessor :reason

      def initialize(errors, reason = nil)
        @errors = errors
        @reason = reason
      end

      def errors
        [ JSONAPI::Error.new(code: 400,
                            status: :bad_request,
                            title: "Bad Request",
                            detail: @errors) ]
      end
    end

    # NotAuthorized JSONAPI wrapper
    class NotAuthorized < JSONAPI::Exceptions::Error
      attr_accessor :reason

      def initialize(reason)
        @reason = reason
      end

      def errors
        [ JSONAPI::Error.new(code: 403,
                            status: :forbidden,
                            title: "Not Authorized",
                            detail: @reason) ]
      end
    end

    # Exception that allows custom message and 400 status
    class BadParam < JSONAPI::Exceptions::Error
      attr_accessor :key, :value, :reason

      def initialize(key, value, reason = nil)
        @key    = key
        @value  = value
        @reason = reason
      end

      def errors
        detail = "Bad parameter #{@key} with value #{@value}.  #{@reason || ''}"

        [ JSONAPI::Error.new(code: 400,
                            status: :bad_request,
                            title: "Bad Parameter",
                            detail: detail) ]
      end
    end

    def v1_index
      user        = pundit_user
      url_helpers = Rails.application.routes.url_helpers
      response    = { links: {}}

      resource_info = [
        { resource_name: "aliquots",        model: Aliquot,       policy: AliquotPolicy },
        { resource_name: "aliquot_effects", model: AliquotEffect, policy: AliquotEffectPolicy },
        { resource_name: "compounds",       model: CompoundLink,  policy: CompoundLinkPolicy },
        { resource_name: "containers",      model: Container,     policy: ContainerPolicy },
        { resource_name: "container_types", model: ContainerType, policy: ContainerTypePolicy },
        { resource_name: "datasets",        model: Dataset,       policy: DatasetPolicy },
        { resource_name: "executions",      model: Execution,     policy: ExecutionPolicy },
        { resource_name: "instructions",    model: Instruction,   policy: InstructionPolicy },
        { resource_name: "launch_requests", model: LaunchRequest, policy: LaunchRequestPolicy },
        { resource_name: "libraries",       model: Library,       policy: LibraryPolicy },
        { resource_name: "organizations",   model: Organization,  policy: OrganizationPolicy },
        { resource_name: "packages",        model: Package,       policy: PackagePolicy },
        { resource_name: "projects",        model: Project,       policy: ProjectPolicy },
        { resource_name: "protocols",       model: Protocol,      policy: ProtocolPolicy },
        { resource_name: "refs",            model: Ref,           policy: RefPolicy },
        { resource_name: "resources",       model: Resource,      policy: ResourcePolicy },
        { resource_name: "runs",            model: Run,           policy: RunPolicy },
        { resource_name: "labs",            model: Lab,           policy: LabPolicy },
        { resource_name: "provision_spec",  model: ProvisionSpec, policy: ProvisionSpecPolicy },
        { resource_name: "synthesis_programs", model: SynthesisProgram, policy: SynthesisProgramPolicy },
        { resource_name: "synthesis_requests", model: SynthesisRequest, policy: SynthesisRequestPolicy }
      ]

      resource_info.each do |info|
        resource_name = info[:resource_name]
        policy_clazz  = info[:policy]
        model_clazz   = info[:model]
        policy        = policy_clazz.new(user, model_clazz)

        if policy.index?
          url = url_helpers.send("api_#{resource_name}_url")
          response[:links][resource_name] = url
        end
      end

      render json: response
    end

    def show_many
      # AliquotResource, ContainerResource, etc
      resource_class = self.send(:resource_klass)

      # Aliquot, Container, etc
      model_class = resource_class._model_class

      # JSONAPI::ResourceSerializer
      serializer_class = self.send(:resource_serializer_klass)

      ids = params.require(:ids).split(',')

      authorize(model_class, :index?)

      fields =
        if params['fields']
          params['fields'].map { |resource_name, field_str|
            [ resource_name.to_sym, field_str.split(',').map(&:to_sym) ]
          }.to_h
        else
          nil
        end

      scope  = Pundit.policy_scope!(pundit_user, model_class)
      models = scope.find(ids)

      resources = models.map do |model|
        resource_class.new(model, context)
      end

      serializer = serializer_class.new(resource_class, { fields: fields })
      json       = serializer.serialize_to_hash(resources)

      render json: json
    end
  end
end
