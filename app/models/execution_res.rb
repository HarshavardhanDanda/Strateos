class ExecutionRes < ApplicationRecord
  # ExecutionResource name is reserved by our JSON API gem
  self.table_name = 'execution_resources'
  belongs_to :execution
end
