module CompoundServiceFacade

  module Scope
    PUBLIC = 0
    PUBLIC_AND_PRIVATE = 1
    PUNDIT_SCOPE = 2
    ALL = 3
  end

  class ScopedCompoundRequest
    include Callable

    def initialize(scope)
      @scope = scope
    end

    def call
      raise NotImplementedError
    end

    def scoped_relation
      case @scope
      when Scope::PUBLIC
        CompoundLink.public_only
      when Scope::PUBLIC_AND_PRIVATE
        CompoundLink.by_org_and_public(Current.organization.id)
      when Scope::PUNDIT_SCOPE
        Pundit.policy_scope!(Current, CompoundLink)
      when Scope::ALL
        CompoundLink.all
      else
        raise StandardError, "Unknown scope: #{@scope}"
      end
    end
  end

  private_constant :ScopedCompoundRequest

  class GetCompound < ScopedCompoundRequest
    def initialize(compound_id, scope = Scope::PUBLIC_AND_PRIVATE)
      super(scope)
      @compound_id = compound_id
    end

    def call
      scoped_relation.find(@compound_id)
    end
  end

  class GetCompounds < ScopedCompoundRequest
    def initialize(params, scope = Scope::PUBLIC_AND_PRIVATE)
      super(scope)
      @params = params
    end

    def call
      apply_filters(scoped_relation)
    end

    private

    FILTERS = {
      compound_id: lambda { |scope, compound_id| scope.where(compound_id: compound_id) },
      compound_link_ids: lambda { |scope, compound_link_ids| scope.where(id: compound_link_ids) },
      organization_id: lambda { |scope, organization_id| scope.where(organization_id: organization_id) },
      flags: lambda { |scope, flags| scope.by_flags(flags) },
      with_identifiers: lambda { |scope, identifiers|
        identifiers.reduce(CompoundLink.none) do |rel, ident|
          rel.or(scope.by_identifier(ident[:value], ident[:notation]))
        end
      }
    }


    def apply_filters(scope)
      @params.each do |key, value|
        scope = FILTERS[key].call(scope, value) if FILTERS[key].present?
      end
      scope
    end
  end

  class GetCompoundsByIds < ScopedCompoundRequest
    def initialize(ids, scope = Scope::PUBLIC_AND_PRIVATE)
      super(scope)
      @ids = ids
    end

    def call
      scoped_relation.where(id: @ids)
    end
  end

  # compounds in index method of /api/v1/compounds_controller.rb can be fetched using
  # this class so that we can use existing filters, sorting, pagination logic provided by compound_resource.rb
  class GetCompoundsByJSONAPI < ScopedCompoundRequest
    def initialize(params, jsonapi_context, scope = Scope::PUBLIC_AND_PRIVATE)
      super(scope)
      @params = params
      @jsonapi_context = jsonapi_context
    end

    def call
      process_jsonapi_request
    end

    private

    def process_jsonapi_request
      request = JSONAPI::RequestParser.new(
        @params,
        context: @jsonapi_context,
      )
      options = request.operations.first&.options
      context = options[:context]

      relation = scoped_relation
      if options[:filters].present?
        filters =  Api::V1::CompoundResource.verify_filters(options[:filters], context)
        relation = Api::V1::CompoundResource.filter_records(filters, options, relation)
      end

      order_options = nil
      if options[:sort_criteria].present?
        sort_criteria = options.fetch(:sort_criteria) { [] }
        order_options = Api::V1::CompoundResource.construct_order_options(sort_criteria)
        relation = Api::V1::CompoundResource.sort_records(relation, order_options, context)
      end

      if options[:paginator].present?
        relation = Api::V1::CompoundResource.apply_pagination(relation, options[:paginator], order_options)
      end

      relation
    end
  end

  # facade class to replace CompoundService.search
  class SearchCompounds
    include Callable

    def initialize(compound, threshold: nil, org_ids: [], include_public: true)
      @compound = compound
      @threshold = threshold
      @org_ids = org_ids
      @include_public = include_public
    end

    def call
      CompoundService.search(@compound, threshold: @threshold, org_ids: @org_ids, include_public: @include_public)
    end
  end

  class CreateCompounds
    include Callable

    def initialize(compounds)
      @compounds = compounds
    end

    def call
      CompoundLink.create_compounds(@compounds, Current.user.id)
    end
  end

  class UpdateCompound
    include Callable

    def initialize(compound_id, compound_data, user)
      @compound_id = compound_id
      @compound_data = compound_data
      @user = user
    end

    def call
      CompoundLink.find(@compound_id).update_compound(@compound_data, @user)
    end
  end

  class DeleteCompound < ScopedCompoundRequest
    def initialize(id, scope = Scope::PUBLIC_AND_PRIVATE)
      super(scope)
      @id = id
    end

    def call
      compound_link = scoped_relation.find(@id)
      labels = compound_link.labels.map(&:id)

      # Destroy in the db
      compound_link.destroy

      # Destroy abandoned labels
      labels.each do |l|
        label = Label.find(l)
        label.destroy unless label.compound_links.any?
      end

      compound_link
    end
  end
end
