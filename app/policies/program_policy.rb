class ProgramPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    @record.can_be_seen_by?(@user)
  end

  def create?
    true
  end

  def destroy?
    @record.user_id == @user.id
  end

  def update?
    @record.user_id == @user.id
  end

  class Scope < Scope
    def resolve
      scope.where(user_id: @user.id)
    end
  end
end
