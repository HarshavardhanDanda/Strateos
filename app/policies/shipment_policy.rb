class ShipmentPolicy < ApplicationPolicy
  def show?
    is_authorized?
  end

  def index?
    is_authorized?
  end

  def destroy?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_any_lab(CHECKIN_SAMPLE_SHIPMENTS) || has_feature_in_org(VIEW_IN_TRANSIT_SAMPLES)
  end

  def checkin?
    has_feature_in_lab(CHECKIN_SAMPLE_SHIPMENTS)
  end

  def partial_checkin?
    has_feature_in_lab(CHECKIN_SAMPLE_SHIPMENTS)
  end

  def checkin_containers?
    has_feature_in_lab(CHECKIN_SAMPLE_SHIPMENTS)
  end

  def create?
    if @record.shipment_type == 'implementation'
      has_feature_in_lab(MANAGE_IMPLEMENTATION_SHIPMENTS)
    else
      record_within_user_orgs? && has_feature_in_org(CREATE_SAMPLE_SHIPMENTS)
    end
  end

  def update?
    if @record.shipment_type == 'implementation'
      has_feature_in_lab(MANAGE_IMPLEMENTATION_SHIPMENTS)
    else
      record_within_user_orgs?
    end
  end

  class Scope < Scope
    def resolve
      if has_shipment_features_in_lab && has_feature_in_org(VIEW_IN_TRANSIT_SAMPLES)
        lab_scope.or(scope.where(organization: @organization))
      elsif has_shipment_features_in_lab
        lab_scope
      elsif has_feature_in_org(VIEW_IN_TRANSIT_SAMPLES)
        scope.where(organization: @organization)
      else
        raise Pundit::NotAuthorizedError
      end
    end

    def has_shipment_features_in_lab
      has_feature_in_any_lab(CHECKIN_SAMPLE_SHIPMENTS) || has_feature_in_any_lab(MANAGE_IMPLEMENTATION_SHIPMENTS)
    end

    def lab_scope
      sample_lab_ids = lab_ids_by_feature(CHECKIN_SAMPLE_SHIPMENTS) if has_feature_in_any_lab(CHECKIN_SAMPLE_SHIPMENTS)
      implementation_lab_ids = lab_ids_by_feature(MANAGE_IMPLEMENTATION_SHIPMENTS) if
                                has_feature_in_any_lab(MANAGE_IMPLEMENTATION_SHIPMENTS)
      if !sample_lab_ids.nil? && !implementation_lab_ids.nil?
        scope.where(lab: sample_lab_ids,
shipment_type: 'sample').or(scope.where(lab: implementation_lab_ids, shipment_type: 'implementation'))
      elsif !sample_lab_ids.nil?
        scope.where(lab: sample_lab_ids, shipment_type: 'sample')
      else
        scope.where(lab: implementation_lab_ids, shipment_type: 'implementation')
      end
    end
  end
end
