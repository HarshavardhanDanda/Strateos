require 'base_resource'

module Api
  module V1
    class OrgProtocolResource < Api::BaseResource
      add_attribute :created_at
      add_attribute :organization_id
      add_attribute :protocol_id
      add_attribute :active
      add_attribute :updated_at
    end
  end
end
