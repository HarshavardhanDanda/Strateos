class WarpPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    @record.can_be_seen_by?(@user)
  end

  class Scope < Scope
    def resolve
      org_ids = @user.organizations.map(&:id)
      scope.joins(instruction: { run: :project })
           .where(projects: { organization_id: org_ids })
    end
  end
end
