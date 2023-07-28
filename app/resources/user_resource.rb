require 'base_resource'

module Api
  module V1
    class UserResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource
      add_attribute :created_at
      add_attribute :email
      add_attribute :feature_groups
      add_attribute :first_name
      add_attribute :is_developer
      add_attribute :last_name
      add_attribute :name
      add_attribute :profile_img_url
      add_attribute :updated_at
      add_attribute :invitation_sent_at
      add_attribute :invitation_accepted_at
      add_attribute :last_sign_in_at
      add_attribute :last_sign_in_ip
      add_attribute :two_factor_auth_enabled, default: false
      add_attribute :locked_out?, default: false

      # has_many :addresses
      # has_many :collaborations
      # has_many :launch_requests
      # has_many :organization_collaborations
      has_many :organizations
      # has_many :packages
      # has_many :projects
      # has_many :runs
    end
  end
end
