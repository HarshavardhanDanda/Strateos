class Execution < ApplicationRecord
  belongs_to :run
  has_many :execution_environment_vars
  # Requires this funky naming, see execution_res.rb
  has_many :exec_resources, class_name: 'ExecutionRes', foreign_key: "execution_id"

  has_snowflake_id('exec')

  after_commit :set_initial_env, on: :create

  # Set additional environment variables. The key, value pairs will be merged
  # into the current environment.
  def set_env(environment)
    immutable_env = {
      EXECUTION_ID: self.id,
      INITIATOR_ID: self.run_id
    }

    env = get_env.merge(environment.symbolize_keys).merge(immutable_env)

    env_list = env.map do |(key, value)|
      {
        execution_id: self.id,
        env_key: key,
        env_value: value
      }
    end

    ActiveRecord::Base.transaction do
      ExecutionEnvironmentVar.where(execution_id: self.id).destroy_all
      ExecutionEnvironmentVar.import(env_list)
    end
  end

  def get_env
    self.execution_environment_vars
        .pluck(:env_key, :env_value)
        .to_h
        .symbolize_keys
  end

  # Returns the upstream compute step
  # C0 -> R1 -> C1
  # If compute C0 launches run R0, and C1 is attached to R0, the C0 is C1's
  # parent
  def parent
    parent_id = ExecutionRes.select(:execution_id).where(run_id: self.run_id)

    Execution.where(id: parent_id).first
  end

  # Returns all downstream compute steps
  def descendents
    sql =  <<-SQL
      WITH RECURSIVE children(id) AS (
          SELECT executions.id
          FROM executions
          JOIN execution_resources ON execution_resources.run_id = executions.run_id
          WHERE execution_resources.execution_id = '#{self.id}'

        UNION
          SELECT executions.id
          FROM children
          JOIN execution_resources ON execution_resources.execution_id = children.id
          JOIN executions ON executions.run_id = execution_resources.run_id
      )
      SELECT id FROM children
    SQL
    Execution.where("executions.id IN (#{sql})")
  end

  private

  def set_initial_env
    env = !parent.nil? ? parent.get_env : {}
    set_env(env)
  end
end
