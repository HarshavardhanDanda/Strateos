class UploadPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    @record.user_id == @user.id
  end

  def create?
    true
  end

  def update?
    false
  end

  def destroy?
    @record.user_id == @user.id
  end

  def complete?
    @record.user_id == @user.id
  end

  def upload_part?
    @record.user_id == @user.id
  end

  class Scope < Scope
    def resolve
      scope.where(user_id: @user.id)
    end
  end
end
