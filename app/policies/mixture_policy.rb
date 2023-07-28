class MixturePolicy < ApplicationPolicy

  def index?
    true
  end

  def create?
    has_feature_in_org(MANAGE_MIXTURES)
  end

  def show?
    has_feature_in_org(VIEW_MIXTURES) && record_within_current_org?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_MIXTURES)
        scope.where(organization: @organization)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
