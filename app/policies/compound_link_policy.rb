class CompoundLinkPolicy < ApplicationPolicy
  def index?
    has_feature_in_org(VIEW_COMPOUNDS) || has_feature_in_org(VIEW_LAB_COMPOUNDS)
  end

  def show?
    return true if @record.organization_id.nil?

    return (has_feature_in_org(VIEW_COMPOUNDS) && record.organization.id == @organization.id) ||
           (has_feature_in_org(VIEW_LAB_COMPOUNDS) && record_within_lab_consuming_orgs)
  end

  def create?
    record_within_user_orgs?
  end

  def create_public?
    has_feature_in_org(REGISTER_PUBLIC_COMPOUND)
  end

  def update?
    if !record.organization
      return has_feature_in_org(UPDATE_PUBLIC_COMPOUND)
    else
      return record_within_lab_consuming_orgs(lab_ids_by_feature(MANAGE_COMPOUNDS_IN_LAB)) ||
        (record.organization.id == @organization.id && has_feature_in_org(EDIT_COMPOUND))
    end
  end

  def update_external_system_id?
    has_feature_in_org(EDIT_COMPOUND) && (record_within_current_org? || record_public?)
  end

  def can_edit_hazard?
    return has_feature_in_org(UPDATE_PUBLIC_COMPOUND) if !record.organization
    return record_within_lab_consuming_orgs(lab_ids_by_feature(MANAGE_COMPOUNDS_IN_LAB))
  end

  def update_public?
    has_feature_in_org(UPDATE_PUBLIC_COMPOUND) && @record.organization_id.nil?
  end

  def destroy?
    # can only destroy molecules you have uploaded
    # TODO: maybe allow org members to delete any org molecule?
    @record.created_by == @user.id
  end

  class Scope < Scope
    def resolve
      if  has_feature_in_org(VIEW_COMPOUNDS) && has_feature_in_org(VIEW_LAB_COMPOUNDS) && user_labs.any?
        orgs = [ @organization.id ]
        scope_helper(orgs)
      elsif has_feature_in_org(VIEW_LAB_COMPOUNDS) && user_labs.any?
        orgs = []
        scope_helper(orgs)
      elsif has_feature_in_org(VIEW_COMPOUNDS)
        org_id = @organization.id
        scope.where("compound_links.organization_id is NULL " \
                    "OR compound_links.organization_id = ?", org_id)
      else
        raise Pundit::NotAuthorizedError
      end
    end

    def scope_helper(orgs)
      user_labs.each do |labId|
        orgs.concat(Lab.find(labId).organizations.map(&:id))
      end
      scope.where(organization_id: nil).or(scope.where(organization: Organization.where(id: orgs.uniq)))
    end
  end
end
