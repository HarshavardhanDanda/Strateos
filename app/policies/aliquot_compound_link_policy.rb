class AliquotCompoundLinkPolicy < ApplicationPolicy
  def index?
    is_authorized?
  end

  def create?
    is_authorized_in_org? || is_authorized_in_lab?
  end

  def destroy?
    is_authorized_in_lab?
  end

  def update?
    is_authorized_in_lab?
  end

  def show?
    is_authorized?
  end

  def is_authorized?
    (has_feature_in_org(VIEW_COMPOUNDS) && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)) || is_authorized_in_lab?
  end

  def is_authorized_in_org?
    (has_feature_in_org(EDIT_CONTAINER) && has_feature_in_org(LINK_COMPOUND_RESOURCE))
  end

  def is_authorized_in_lab?
    (has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) && has_feature_in_org(VIEW_LAB_COMPOUNDS))
  end

  class Scope < Scope
    def is_authorized_in_org?
      (has_feature_in_org(VIEW_COMPOUNDS) && has_feature_in_org(VIEW_SAMPLE_CONTAINERS))
    end

    def is_authorized_in_lab?
      (has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) && has_feature_in_org(VIEW_LAB_COMPOUNDS))
    end

    def resolve
      if is_authorized_in_org? && is_authorized_in_lab?
        # VIEW_LAB_COMPOUNDS is not required since it's an org level permission,
        # it's automatically refers to the all labs
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        org_ids = [ @organization.id, nil ]
        lab_ids.each do |lab_id|
          org_ids.concat(Lab.find(lab_id)&.organizations&.map(&:id))
        end
        scope.joins(aliquot: :container).joins(:compound_link)
        .where("containers.lab_id in (:lab_ids)
         or containers.organization_id = :organization_id
         and compound_links.organization_id in (:org_ids)",
         { lab_ids: lab_ids,
           organization_id: @organization.id,
           org_ids: org_ids
         }
        )
      elsif is_authorized_in_lab?
        # VIEW_LAB_COMPOUNDS is not required since it's an org level permission,
        # it's automatically refers to the all labs
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        lab_specific_orgs = [ nil ]
        lab_ids.each do |lab_id|
          lab_specific_orgs.concat(Lab.find(lab_id)&.organizations&.map(&:id))
        end

        scope.joins(aliquot: :container).joins(:compound_link)
         .where(containers: { lab_id: lab_ids }, compound_links: { organization_id: lab_specific_orgs.uniq })
      elsif is_authorized_in_org?
        scope
          .joins(aliquot: :container)
          .joins(:compound_link)
          .where(containers: { organization_id: @organization.id },
                 compound_links: { organization_id: [ @organization.id, nil ] })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
