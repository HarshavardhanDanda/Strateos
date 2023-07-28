class LabConsumerPolicy < ApplicationPolicy
  def index?
    true
  end

  class Scope < Scope
    def resolve
      if can_manage_orgs_global?
        scope
      elsif user_labs.any?
        scope.where(organization: @organization).or(scope.where(lab: user_labs))
      else
        scope.where(organization: @organization)
      end
    end
  end
end
