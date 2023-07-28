class CollaboratorPolicy < ApplicationPolicy
  def index?
    true
  end

  class Scope < Scope
    def resolve
      if can_manage_orgs_global?
        scope
      elsif user_labs.any?
        lab_consumers = LabConsumer.where(lab_id: user_labs)
        org_ids = lab_consumers.pluck(:organization_id).uniq
        scope.where(collaborative_id: org_ids)
      else
        scope.where(collaborative_id: @organization.id)
      end
    end
  end
end
