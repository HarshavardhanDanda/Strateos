class ProtocolPolicy < ApplicationPolicy
  def manage?
    return false if eigenclass?

    has_feature_in_org(PUBLISH_RELEASE_PACKAGE_PROTOCOL)
  end

  def index?
    true
  end

  def show?
    PackagePolicy.new(user_context, @record.package).show?
  end

  def publish_or_retract?
    @record.package.organization.id == @organization.id && has_feature_in_org(PUBLISH_RELEASE_PACKAGE_PROTOCOL)
  end

  class Scope < Scope
    def resolve
      org_ids = @user.organizations.map(&:id)
      scope.joins(:package).where("packages.public OR packages.organization_id IN (?)", org_ids)
    end
  end
end
