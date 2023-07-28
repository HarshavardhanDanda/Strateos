class UserPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    @record.id == @user.id
  end

  def can_mange_org?
    @permissions["org_ctx_permissions"].include?('ADMINISTRATION')
  end

  def administer?
    @record.administrator?(@user)
  end

  def search?
    has_platform_feature(VIEW_USERS_GLOBAL)
  end

  def manage_users_global?
    has_platform_feature(MANAGE_USERS_GLOBAL)
  end

  def can_remove_users_from_platform?
    has_platform_feature(CAN_REMOVE_USERS_FROM_PLATFORM)
  end

  class Scope < Scope
    def resolve
      if has_platform_feature(VIEW_USERS_GLOBAL)
        scope
      elsif user_labs.any?
        lab_consumers  = LabConsumer.where(lab_id: user_labs)
        org_ids = lab_consumers.pluck(:organization_id).uniq
        scope.where(id: Collaborator.where(collaborative_id:org_ids).pluck(:collaborating_id).uniq)
      else
        scope.where(id: Collaborator.where(collaborative_id: @organization.id).pluck(:collaborating_id).uniq)
      end
    end
  end
end
