class SearchkickProcessQueueJob < ActiveJob::Base
  queue_as { Searchkick.queue_name }

  def perform(class_name)
    Searchkick::ProcessQueueJob.perform_now(class_name: class_name)
  end
end
