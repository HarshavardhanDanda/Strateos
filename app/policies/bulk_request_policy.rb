class BulkRequestPolicy < ApplicationPolicy

  def index?
    true
  end

  def show?
    true
  end

  def create?
    return authorize_container_action if @record.context_type == BulkRequest::CONTAINER

    super
  end

  def authorize_container_action
    case @record.bulk_action
    when BulkRequest::ACTION_RELOCATE, BulkRequest::ACTION_TRANSFER
      has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
    when BulkRequest::ACTION_DELETE
      has_feature_in_any_lab(DESTROY_CONTAINER_RESET_ALL_ALIQUOTS)
    when BulkRequest::ACTION_DESTROY
      has_feature_in_org(DESTROY_CONTAINER) || has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
    when BulkRequest::ACTION_DOWNLOAD
      true
    else
      false
    end
  end

  class Scope < Scope
    def resolve
      scope.where(organization_id: @organization.id)
    end
  end
end
