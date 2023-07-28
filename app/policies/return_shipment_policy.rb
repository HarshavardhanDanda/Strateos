class ReturnShipmentPolicy < ApplicationPolicy

  def index?
    has_feature_in_org(VIEW_SAMPLE_RETURN_SHIPMENTS) || has_feature_in_any_lab(MANAGE_SAMPLE_RETURN_SHIPMENTS)
  end

  def create?
    has_feature_in_org(REQUEST_SAMPLE_RETURN) && record_within_user_orgs?
  end

  def update?
    authorized_in_org?
  end

  def destroy_abandoned?
    authorized_in_org?
  end

  def pending?
    has_feature_in_any_lab(MANAGE_SAMPLE_RETURN_SHIPMENTS)
  end

  def purchase?
    is_authorized?
  end

  def ship?
    is_authorized?
  end

  def cancel?
    is_authorized?
  end

  def record_in_scope?
    scope.include? @record
  end

  def is_authorized?
    record_in_scope? && has_feature_in_lab(MANAGE_SAMPLE_RETURN_SHIPMENTS)
  end

  def authorized_in_org?
    has_feature_in_org(REQUEST_SAMPLE_RETURN) && record_within_current_org?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_SAMPLE_RETURN_SHIPMENTS) && has_feature_in_any_lab(MANAGE_SAMPLE_RETURN_SHIPMENTS)
        lab_ids = lab_ids_by_feature(MANAGE_SAMPLE_RETURN_SHIPMENTS)
        scope.where(organization: @organization).or(scope.where(lab: lab_ids))
      elsif has_feature_in_any_lab(MANAGE_SAMPLE_RETURN_SHIPMENTS)
        scope.where(lab: lab_ids_by_feature(MANAGE_SAMPLE_RETURN_SHIPMENTS))
      elsif has_feature_in_org(VIEW_SAMPLE_RETURN_SHIPMENTS)
        scope.where(organization: @organization)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
