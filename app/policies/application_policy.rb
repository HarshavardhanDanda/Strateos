class ApplicationPolicy
  attr_reader :user, :record, :permissions, :organization

  def initialize(context, record)
    @user = context.user
    @organization = context.organization
    @record = record
    @permissions = context.permissions

    # wrap all authorization methods with logic
    # to check if the user is an admin or if the user
    # can manage? the model.
    authorization_methods.each do |m|
      # point to the method we are wrapping
      method_pointer = method(m)

      # point to the original managed, non-wrapped version, to avoid recursion.
      manage_method_pointer = method(:manage?)

      wrapped_method =
        if m == :manage?
          # Manage? block should not recurse and call manage as is the default.
          -> { method_pointer.call }
        else
          -> { manage_method_pointer.call || method_pointer.call }
        end

      define_singleton_method(m, &wrapped_method)
    end
  end

  # Find all pundit authorization methods which are defined as
  # methods ending in '?' that aren't on the ignore list.
  def authorization_methods
    # we don't want to include all inherrited method, like 'is_a?', just the instance's
    # methods and application policies methods.
    all_methods = ApplicationPolicy.instance_methods(false) + self.public_methods(false)

    methods_to_ignore = ignore_admin_precheck_for

    # methods ending in '?' that we should skip are considered auth methods.
    all_methods.uniq.select do |m|
      m.to_s.ends_with?('?') && !methods_to_ignore.include?(m)
    end
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def new?
    create?
  end

  def update?
    false
  end

  def edit?
    update?
  end

  def destroy?
    false
  end

  # equivalent to Cancancan manage.  Wildcard policy,
  # if passes checks, then skips further policy check.
  def manage?
    false
  end

  # Checks if the record's organization is included in on of the users
  def record_within_user_orgs?
    @user.member_of_org?(@record.organization)
  end

  def record_within_current_org?
    @record.organization == @organization
  end

  def record_public?
    !@record.organization
  end

  def eigenclass?
    # assume a record is either the eigenclass (Aliquot, Container) or an single record.
    !@record.is_a?(ActiveRecord::Base)
  end

  def super_admin?
    @user.feature_groups.include?('admin_sunset') && @organization.feature_groups.include?('admin_sunset')
  end

  def can_manage_orgs_global?
    has_platform_feature(MANAGE_ORGS_GLOBAL)
  end

  def can_view_global_invoices?
    has_platform_feature(VIEW_INVOICES_GLOBAL)
  end

  def can_manage_global_invoices?
    has_platform_feature(MANAGE_INVOICES_GLOBAL)
  end

  def has_platform_feature(feature)
    @permissions.present? && @permissions["platform_ctx_permissions"].present? &&
      @permissions["platform_ctx_permissions"].include?(feature)
  end

  # A list of methods to not dynamically redefine with an admin/manage
  # precheck.  By default we only wrap methods that end in a question mark.
  # We need this to determine which methods are actual authorization methods
  # and want to ere on the side of more security and assume that `?` equals
  # pundit auth method.
  def ignore_admin_precheck_for
    [ :record_within_user_orgs?, :eigenclass? ]
  end

  def user_context
    UserContext.new(user, organization, permissions)
  end

  def scope
    if record.class.superclass == Resource
      Pundit.policy_scope!(user_context, Resource)
    else
      Pundit.policy_scope!(user_context, record.class)
    end
  end

  def has_feature_in_lab(feature, record = @record)
    lab_features = @permissions && @permissions["lab_ctx_permissions"].find { |lab| lab["labId"] == record.lab&.id }
    !lab_features.nil? && lab_features["features"]&.include?(feature)
  end

  def has_features_in_any_lab(features)
    lab_ids_by_features(features)&.any?
  end

  def has_feature_in_org(feature)
    @permissions && @permissions["org_ctx_permissions"]&.include?(feature)
  end

  def has_feature_in_any_lab(feature)
    @permissions && !@permissions["lab_ctx_permissions"]&.find { |lab| lab["features"].include?(feature) }.nil?
  end

  def lab_ids_by_feature(feature)
    labs = @permissions && @permissions["lab_ctx_permissions"]&.select { |lab| lab["features"].include?(feature) }
    labs&.map { |lab| lab["labId"] }
  end

  def lab_ids_by_features(features)
    labs = @permissions && @permissions["lab_ctx_permissions"]&.select { |lab|
 (lab["features"] & features).size == features.size }
    labs&.map { |lab| lab["labId"] }
  end

  def user_labs
    @permissions && @permissions["lab_ctx_permissions"].map { |lab| lab["labId"] }
  end

  def record_within_lab_consuming_orgs(labs = user_labs)
    orgs=[]
    labs.each do |labId|
      orgs.concat(Lab.find(labId).organizations.map(&:id))
    end
    orgs.uniq.include? @record.organization_id
  end

  def is_authorized_in_org(feature)
    record_within_current_org? && has_feature_in_org(feature)
  end

  def is_authorized_in_lab(feature)
    lab_ids = (feature.is_a? Array) ? lab_ids_by_features(feature) : lab_ids_by_feature(feature)
    lab_ids.present? && record_within_lab_consuming_orgs(lab_ids)
  end

  def is_authorized?
    false
  end

  class Scope
    attr_reader :user, :scope, :permissions, :organization

    def initialize(context, scope)
      @user = context.user
      @scope = scope
      @permissions = context.permissions
      @organization = context.organization
    end

    def resolve
      scope
    end

    def super_admin?
      @user.feature_groups.include?('admin_sunset') && @organization.feature_groups.include?('admin_sunset')
    end

    def can_manage_orgs_global?
      has_platform_feature(MANAGE_ORGS_GLOBAL)
    end

    def has_platform_feature(feature)
      @permissions.present? && @permissions["platform_ctx_permissions"].present? &&
        @permissions["platform_ctx_permissions"].include?(feature)
    end

    def has_feature_in_org(feature)
      @permissions && @permissions["org_ctx_permissions"]&.include?(feature)
    end

    def has_feature_in_any_lab(feature)
      @permissions && !@permissions["lab_ctx_permissions"]&.find { |lab| lab["features"].include?(feature) }.nil?
    end

    def lab_ids_by_feature(feature)
      labs = @permissions && @permissions["lab_ctx_permissions"]&.select { |lab| lab["features"].include?(feature) }
      labs&.map { |lab| lab["labId"] }
    end

    def has_features_in_any_lab(features)
      lab_ids_by_features(features)&.any?
    end

    def lab_ids_by_features(features)
      labs = @permissions && @permissions["lab_ctx_permissions"]&.select { |lab|
 (lab["features"] & features).size == features.size }
      labs&.map { |lab| lab["labId"] }
    end

    def user_labs
      @permissions["lab_ctx_permissions"].map { |lab| lab["labId"] }
    end

    def get_consumer_orgs_of_lab_with_feature(feature)
      consumer_org_ids = []
      lab_ids = lab_ids_by_feature(feature) || []
      lab_ids.each do |labId|
        consumer_org_ids.concat(Lab.find(labId).organizations.map(&:id))
      end
       return consumer_org_ids.uniq
    end
  end
end
