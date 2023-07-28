class ApplicationRecord < ActiveRecord::Base
  include PpSql::ToSqlBeautify if defined?(Rails::Console)
  self.abstract_class = true

  prepend SearchkickParallelTest if Rails.env.test? && ENV['PARALLEL_WORKERS'].to_i > 1

  # This method is being added during the upgrade from Rails 5.2.6.2 to Rails 6.0.0
  # The expected behavior when converting a BigDecimal type to json format is to convert that value into a string. It
  # seems that this method was missed during the implementation of that behavior. It's been implemented on Rails 6.0.0.
  # Currently there are parts of the webapp that still need to keep the BigDecimal value as a number and not a string.
  # This method implements the old functionality, retaining the BigDecimal type instead of converting into string.
  def searchkick_as_json(options = nil)
    root = if options && options.key?(:root)
             options[:root]
           else
             include_root_in_json
           end
    if root
      root = model_name.element if root == true
      { root => serializable_hash(options) }
    else
      serializable_hash(options)
    end
  end

  def run_bulk_import_callbacks(only_before = true, searchkick_callbacks = false)
    # Unfortunately, the only option is to run both before and after callbacks OR just before callbacks `{ false }`.
    # In most cases when bulk importing, we want to run only before callbacks before importing.
    # In cases when we need to run after callbacks, we have to run before _and_ after callbacks
    # together (usually after bulk importing).
    Searchkick.callbacks(searchkick_callbacks) do
      run_callbacks(:create) { !only_before } if new_record?
      run_callbacks(:update) { !only_before } unless new_record?
      run_callbacks(:save) { !only_before }
      run_callbacks(:commit) { !only_before }
    end
  end

  def self.distinct_on_id
    -> { unscope(:order).select("DISTINCT ON (#{self.model_name.plural}.id) #{self.model_name.plural}.*") }
  end
end
