class ConversationPolicy < ApplicationPolicy
  def show?
    record_within_user_orgs?
  end

  def update?
    record_within_user_orgs? || has_feature_in_lab(VIEW_RUNS_IN_LABS, @record.run)
  end
end
