class SynthesisRequestPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    is_authorized_in_org(CREATE_BATCH) || is_authorized_in_lab(MANAGE_BATCHES_IN_LAB)
  end

  def update?
    is_authorized_in_org(EDIT_BATCH) || is_authorized_in_lab(MANAGE_BATCHES_IN_LAB)
  end

  def show?
    is_authorized_in_org(VIEW_BATCHES) || is_authorized_in_lab(MANAGE_BATCHES_IN_LAB)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_BATCHES) && has_feature_in_any_lab(MANAGE_BATCHES_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_BATCHES_IN_LAB)
        scope.where(organization_id: consumer_org_ids.concat([ @organization.id ]))
      elsif has_feature_in_org(VIEW_BATCHES)
        scope.where(organization_id: @organization.id)
      elsif has_feature_in_any_lab(MANAGE_BATCHES_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_BATCHES_IN_LAB)
        scope.where(organization_id: consumer_org_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
