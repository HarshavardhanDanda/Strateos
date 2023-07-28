class NotebookPolicy < ApplicationPolicy
  def show?
    @record.project.can_be_seen_by?(@user)
  end

  def update?
    @record.user_id == @user.id
  end
end
