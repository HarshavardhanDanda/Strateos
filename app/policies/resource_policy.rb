class ResourcePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    scope&.map(&:id)&.include? @record.id
  end

  def create?
    is_authorized?
  end

  def update?
    is_authorized?
  end

  def destroy?
    is_authorized?
  end

  def reserve?
    record_within_user_orgs?
  end

  def is_authorized?
    has_feature_in_org(MANAGE_KITS_VENDORS_RESOURCES) && @record.organization_id.eql?(@organization.id)
  end

  class Scope < Scope
    def resolve
      organization_ids = @organization.labs.map(&:operated_by_id)
      organization_ids << @organization.id
      scope.where(organization_id: organization_ids).or(scope.where(organization_id: nil))
    end
  end
end
