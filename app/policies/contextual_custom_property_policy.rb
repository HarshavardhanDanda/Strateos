class ContextualCustomPropertyPolicy < ApplicationPolicy

  def index?
    true
  end

  def create_or_update?
    record_within_current_org?
  end

  def record_within_current_org?
    @record.contextual_custom_properties_config.organization.id == @organization.id
  end

  class Scope < Scope
    def resolve
      scope
    end
  end
end
