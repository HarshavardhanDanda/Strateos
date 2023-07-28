class OrgCollaborationPolicy < ApplicationPolicy
  def index?
    true
  end

  class Scope < Scope
    def resolve
      scope.where(src_org_id: @organization.id)
    end
  end
end
