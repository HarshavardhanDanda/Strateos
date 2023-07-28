class ContainerPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def authorized_in_lab?
    has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def authorized_in_org?
    has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
  end

  def is_authorized?
    authorized_in_lab? || authorized_in_org?
  end

  def log_location_pick_success?
    has_feature_in_any_lab(CHECKIN_SAMPLE_SHIPMENTS) || has_feature_in_org(MANAGE_KIT_ORDERS)
  end

  def log_location_override?
    has_feature_in_any_lab(CHECKIN_SAMPLE_SHIPMENTS) || has_feature_in_org(MANAGE_KIT_ORDERS)
  end

  def show?
    (record_within_current_org? && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)) ||
      has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def create?
    (record_within_current_org_or_org_null? && (has_feature_in_org(CREATE_TEST_CONTAINERS) ||
      has_feature_in_org(CREATE_SAMPLE_SHIPMENTS))) || has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def delete?
    has_feature_in_lab(DESTROY_CONTAINER_RESET_ALL_ALIQUOTS)
  end

  def search?
    is_authorized?
  end

  def update?
    (has_feature_in_org(EDIT_CONTAINER) && record_within_current_org_or_org_null?) ||
      has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def manage_tisos_container?
    has_feature_in_lab(MANAGE_TISOS)
  end

  def move?
    has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def destroy?
    ((has_feature_in_org(DESTROY_CONTAINER) || has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)) &&
      record_within_current_org_or_org_null?)
  end

  def shipment_container_destroy?
    has_feature_in_org(DESTROY_CONTAINER) || has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def split?
    has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB)
  end

  def use?
    record_within_user_orgs_or_transcriptic? or record_within_strateos_org?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.with_deleted.where(lab: lab_ids).or(scope.with_deleted.where(organization: @organization))

      elsif has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.with_deleted.where(lab: lab_ids)

      elsif has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        scope.with_deleted.where(organization: @organization)

      else
        raise Pundit::NotAuthorizedError
      end
    end
  end

  def ignore_admin_precheck_for
    super + [ :record_within_user_orgs_or_transcriptic? ]
  end

  def record_within_user_orgs_or_transcriptic?
    if record_within_user_orgs?
      true
    else
      # TODO: SUPER HACK!!!!!!
      # Allow users of the transcriptic organization access to other
      # organization's containers.
      # This is a hack to allow our application scientists
      # to create runs using the customers inventory for validation purposes.
      transcriptic_org = Organization.select(:id).find_by(subdomain: 'transcriptic')

      @user.organizations.member?(transcriptic_org)
    end
  end

  def record_within_strateos_org?
    @record.organization.subdomain == 'strateos'
  end

  def record_within_current_org_or_org_null?
     if record_within_current_org?
       true
     else
       @record.organization.nil?
     end
  end
end
