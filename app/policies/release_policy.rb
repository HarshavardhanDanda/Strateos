class ReleasePolicy < ApplicationPolicy
  def manage?
    return false if eigenclass?

    PackagePolicy.new(user_context, @record.package).update?
  end

  def show?
    PackagePolicy.new(user_context, @record.package).show?
  end
end
