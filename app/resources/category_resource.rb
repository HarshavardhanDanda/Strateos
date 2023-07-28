require 'base_resource'

module Api
  module V1
    class CategoryResource < Api::BaseResource
      add_attribute :path

      has_many :materials

      filter :path
    end
  end
end
