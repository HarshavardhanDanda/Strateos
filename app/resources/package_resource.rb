require 'base_resource'

module Api
  module V1
    class PackageResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :created_at
      add_attribute :deleted_at
      add_attribute :description
      add_attribute :latest_release_id
      add_attribute :name
      add_attribute :organization_id
      add_attribute :owner_id
      add_attribute :public
      add_attribute :readme
      add_attribute :updated_at

      has_many :protocols
    end
  end
end
