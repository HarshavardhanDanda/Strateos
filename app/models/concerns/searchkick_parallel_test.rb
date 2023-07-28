module SearchkickParallelTest
  extend ActiveSupport::Concern

  # Use the parallel test worker ID as the index prefix for isolated testing
  # when sharing the same ES cluster.
  #
  # The worker ID must be lazy evaluated (i.e. a proc) because `parallelize_setup`,
  # where the test processes fork, occurs _after_ `searchkick` has been called on the models.
  #
  # Note: We can remove this once we upgrade to Searchkick 5, see parallelize_setup in test_helper
  #
  class_methods do
    def searchkick(searchkick_options = {})
      searchkick_options.merge!({ index_prefix: -> { ENV['TEST_WORKER_ID'] }})
      super(**searchkick_options)
    end
  end
end
