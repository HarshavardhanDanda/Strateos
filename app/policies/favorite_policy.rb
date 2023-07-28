class FavoritePolicy < ApplicationPolicy

  def index?
    true
  end

  def destroy?
    @record.user.id == @user.id
  end

  class Scope < Scope
    def resolve
      scope.where(user: @user)
    end
  end

end
