module Callable
  extend ActiveSupport::Concern

  included do
    private_class_method :new
  end

  class_methods do
    def call(*args, **kwargs)
      new(*args, **kwargs).call
    end
  end
end
