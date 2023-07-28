class QuickLaunchPolicy < ApplicationPolicy
  def show?
    @record.project.can_be_seen_by?(@user)
  end

  def create?
    @record.project.can_be_seen_by?(@user)
  end
end
