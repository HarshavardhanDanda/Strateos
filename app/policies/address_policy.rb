class AddressPolicy < ApplicationPolicy
  def show?
    record_within_user_orgs? || can_manage_orgs_global?
  end

  def approve?
    false
  end

  def mail_to?
    record_within_user_orgs?
  end
end
