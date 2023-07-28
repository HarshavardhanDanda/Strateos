class ContextualCustomPropertiesConfigPolicy < ApplicationPolicy
  def index?
    true
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        lab_specific_orgs = [ @organization.id ]
        lab_ids.each do |lab_id|
          lab_specific_orgs.concat(Lab.find(lab_id)&.organizations&.map(&:id))
        end
        scope.where(organization: lab_specific_orgs.uniq)
      else
        scope.where(organization: @organization)
      end
    end
  end
end
