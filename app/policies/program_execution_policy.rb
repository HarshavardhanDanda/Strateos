class ProgramExecutionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    @record.can_be_seen_by?(@user)
  end

  def create?
    true
  end

  def destroy?
    @record.started_at.nil? && @record.user_id == @user.id
  end

  def update?
    has_feature_in_lab(SUBMIT_INSTRUCTIONS_TO_EXECUTE, @record.run)
  end

  class Scope < Scope
    def resolve
      lab_ids = lab_ids_by_feature(SUBMIT_INSTRUCTIONS_TO_EXECUTE)
      scope.joins(:run).where("runs.lab_id IN (?)", lab_ids)
    end
  end
end
