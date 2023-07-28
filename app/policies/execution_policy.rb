class ExecutionPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    true
  end

  def show?
    @record.run.can_be_seen_by?(@user)
  end

  def update?
    @record.run.can_be_seen_by?(@user)
  end

  class Scope < Scope
    def resolve
      org_ids = @user.organizations.map(&:id)
      scope.joins(run: :project).where(projects: { organization_id: org_ids })
    end
  end
end
