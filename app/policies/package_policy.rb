class PackagePolicy < ApplicationPolicy
  def show?
    @record.public || has_feature_in_org(VIEW_PACKAGE_PROTOCOLS) || is_authorized_in_lab(CLONE_RUN_IN_LAB)
  end

  def index?
    true
  end

  def create?
    has_feature_in_org(CREATE_PACKAGE_PROTOCOL)
  end

  def update?
    has_feature_in_org(UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL) ||
      has_feature_in_org(PUBLISH_RELEASE_PACKAGE_PROTOCOL)
  end

  def destroy?
    has_feature_in_org(UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_PACKAGE_PROTOCOLS)
        scope.where(organization: @organization)
      else
        scope.where("public")
      end
    end
  end
end
