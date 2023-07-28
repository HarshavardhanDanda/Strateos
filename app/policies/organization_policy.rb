class OrganizationPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    @record.user_can_view?(@user) || can_manage_orgs_global? ||
      org_is_consumer_of_allowed_labs
  end

  def update?
    @record.id == @organization.id || can_manage_orgs_global?
  end

  def admin?
    @record.admin?(@user)
  end

  def create?
    has_platform_feature(CREATE_DELETE_ORGANIZATION)
  end

  def destroy?
    has_platform_feature(CREATE_DELETE_ORGANIZATION)
  end

  def member?
    @user.organizations.member?(@record)
  end

  def develop?
    @user.is_developer && @record.user_can_view?(@user)
  end

  def show_labels?
    @user.organizations.member?(@record)
  end

  def search?
    has_platform_feature(MANAGE_ORGS_GLOBAL)
  end

  def org_is_consumer_of_allowed_labs
    unless permissions.empty?
      @permissions['lab_ctx_permissions'].find do |l|
        lab = Lab.find(l["labId"])
        return true if lab&.organizations&.map(&:id)&.include?(@record.id)
      end
    end
    false
  end

  class Scope < Scope
    def resolve
      if has_platform_feature(MANAGE_ORGS_GLOBAL)
        scope
      elsif @permissions["lab_ctx_permissions"].any?
        consuming_orgs = scope.joins(:lab_consumers).where(lab_consumers: { lab_id: user_labs }).map(&:id)
        user_orgs = @user.organizations.map(&:id)
        scope.where(id: (consuming_orgs + user_orgs).uniq)
      else
        @user.organizations
      end
    end
  end
end
