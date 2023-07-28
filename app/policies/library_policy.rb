class LibraryPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    has_feature_in_org(CREATE_LIBRARY)
  end

  def update?
    (record_within_current_org? && has_feature_in_org(EDIT_LIBRARY)) || is_authorized_in_lab(MANAGE_LIBRARIES_IN_LAB)
  end

  def show?
    (record_within_current_org? && has_feature_in_org(VIEW_LIBRARIES)) || is_authorized_in_lab(MANAGE_LIBRARIES_IN_LAB)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_LIBRARIES) && has_feature_in_any_lab(MANAGE_LIBRARIES_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_LIBRARIES_IN_LAB)
        scope.where(organization_id: consumer_org_ids.concat([ @organization.id ]))
      elsif has_feature_in_any_lab(MANAGE_LIBRARIES_IN_LAB)
        consumer_org_ids = get_consumer_orgs_of_lab_with_feature(MANAGE_LIBRARIES_IN_LAB)
        scope.where(organization_id: consumer_org_ids)
      elsif has_feature_in_org(VIEW_LIBRARIES)
        scope.where(organization: @organization)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
