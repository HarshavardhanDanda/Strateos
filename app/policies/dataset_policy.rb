class DatasetPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    if not @record.run.nil?
      return RunPolicy.new(user_context, @record.run).show?
    elsif not @record.instruction.nil?
      return false if @record.instruction.run.nil?

      return RunPolicy.new(user_context, @record.instruction.run).show?
    elsif not self.warp.nil?
      return false if @record.warp.run.nil?

      return RunPolicy.new(user_context, @record.warp.run).show?
    else
      return false
    end
  end

  def update?
    @record.can_be_seen_by?(@user)
  end

  def destroy?
    has_feature_in_lab(VIEW_RUNS_IN_LABS, @record.run) || (@record.is_analysis && @record.is_owner?(@user))
  end

  def attach_data_object?
    @record.can_be_seen_by?(@user)
  end

  class Scope < Scope
    def resolve
        org_ids = @user.organizations.map(&:id)

        # TODO: figure out a less expensive scoping here.
        scope.joins(
          <<-SQL
            LEFT OUTER JOIN instructions ON instructions.id = datasets.instruction_id
            INNER JOIN runs ON (runs.id = instructions.run_id OR runs.id = datasets.run_id)
            INNER JOIN projects ON projects.id = runs.project_id
          SQL
        ).where(projects: { organization_id: org_ids })
    end
  end
end
