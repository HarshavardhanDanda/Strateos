class IntakeKitPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def show?
    (record_within_current_org? && has_feature_in_org(VIEW_INTAKEKIT_SHIPMENTS)) ||
      has_feature_in_lab(INTAKE_KITS_SHIPMENTS)
  end

  def create?
    record_within_current_org? && has_feature_in_org(REQUEST_SAMPLE_CONTAINERS)
  end

  def update?
    has_feature_in_lab(INTAKE_KITS_SHIPMENTS)
  end

  def is_authorized?
    has_feature_in_any_lab(INTAKE_KITS_SHIPMENTS) || has_feature_in_org(VIEW_INTAKEKIT_SHIPMENTS)
  end

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_INTAKEKIT_SHIPMENTS) && has_feature_in_any_lab(INTAKE_KITS_SHIPMENTS)
        lab_ids = lab_ids_by_feature(INTAKE_KITS_SHIPMENTS)
        scope.where(organization: @organization).or(scope.where(lab: lab_ids))
      elsif has_feature_in_org(VIEW_INTAKEKIT_SHIPMENTS)
        scope.where(organization: @organization)
      elsif  has_feature_in_any_lab(INTAKE_KITS_SHIPMENTS)
        lab_ids = lab_ids_by_feature(INTAKE_KITS_SHIPMENTS)
        scope.where(lab: lab_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
