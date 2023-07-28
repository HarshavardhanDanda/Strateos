class LabPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    scope.all.include? @record
  end

  class Scope < Scope
    def resolve
      if can_manage_orgs_global?
        scope
      else
        join=scope.left_outer_joins(:lab_consumers)
        join.where(lab_consumers: { organization: @organization })
            .or(join.where(labs: { operated_by: @organization })).distinct
      end
    end
  end
end
