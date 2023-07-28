class AliquotEffectPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    affected_container = @record.affected_container
    (affected_container.organization_id == @organization.id && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)) ||
      has_feature_in_lab(MANAGE_CONTAINERS_IN_LAB, affected_container)
  end

  class Scope < Scope
    def resolve
      container_join_sql = 'INNER JOIN containers ON (aliquot_effects.affected_container_id = containers.id)'
      if has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB) && has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.joins(container_join_sql).where(containers: { organization_id: @organization.id })
             .or(scope.joins(container_join_sql).where(containers: { lab_id: lab_ids }))
      elsif has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
        lab_ids = lab_ids_by_feature(MANAGE_CONTAINERS_IN_LAB)
        scope.joins(container_join_sql).where(containers: { lab_id: lab_ids })
      elsif has_feature_in_org(VIEW_SAMPLE_CONTAINERS)
        scope.joins(container_join_sql).where(containers: { organization_id: @organization.id })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
