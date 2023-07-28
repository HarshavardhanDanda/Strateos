class PostPolicy < ApplicationPolicy
  def manage?
    return false if eigenclass?

    @record.author_id == @user.id
  end

  def show?
    @user.organizations.member?(@record.conversation.organization)
  end

  def destroy?
    @record.author_id == @user.id
  end
end
