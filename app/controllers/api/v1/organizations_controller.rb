module Api
  module V1
    class OrganizationsController < Api::ApiController
      CREATE_SCHEMA = {
                        "$schema": "http://json-schema.org/draft-04/schema#",
                        type: "object", required: [ "attributes" ],
                        properties: {
                          attributes: {
                            type: "object", required: [ "creating_user_email", "kind", "name", "subdomain",
                                                        "org_type", "lab_id" ],
                            properties: {
                              creating_user_email: { type: "string" },
                              kind: { type: "string" },
                              lab_id: { type: "string" },
                              name: { type: "string" },
                              org_type: { type: "string" },
                              subdomain: { type: "string" }
                            }
                          }
                        }
                      }

      def search
        authorize(Organization, :search?)
        q         = params.fetch(:q, '*')
        order_by  = params.fetch(:order_by, :_score)
        direction = params.fetch(:direction, :desc)
        per_page  = params.fetch(:per_page, 10).to_i
        page      = params.fetch(:page, 1).to_i

        request = Organization.search(
          q,
          per_page: per_page ,
          page:     page,
          order:    { order_by => direction },
          fields:   [ :name, :subdomain ],
          misspellings: { edit_distance: 0 },
          match: :word_start
        )

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::OrganizationResource)
        resources  = request.results.map { |org| Api::V1::OrganizationResource.new(org, context) }
        json       = serializer.serialize_to_hash(resources)

        json[:meta] = {
          record_count: request.total_count
        }

        render json: json
      end

      def create
        authorize(Organization.new, :create?)
        data = params.require(:data).to_unsafe_h
        validate_json(CREATE_SCHEMA, data)
        attributes = data[:attributes]
        lab_attrs = attributes.slice(:lab_id, :org_type)
        org_attrs = attributes.slice(:name, :subdomain, :kind, :org_type)
        creating_user_email = attributes[:creating_user_email]
        creating_user = User.find_by_email(creating_user_email)

        if creating_user.nil?
          raise JSONAPI::Exceptions::RecordNotFound.new(creating_user_email)
        end

        org_attrs[:owner_id] = creating_user.id

        organization = nil

        ActiveRecord::Base.transaction do
          organization = Organization.create!(org_attrs)

          organization.assign_lab(lab_attrs)

          acs_data = {
            orgId: organization.id,
            orgAdminUserId: creating_user.id,
            orgType: org_attrs[:org_type]
          }

          ACCESS_CONTROL_SERVICE.initialize_org(creating_user, @organization, acs_data)

          serializer = JSONAPI::ResourceSerializer.new(Api::V1::OrganizationResource)
          org = Api::V1::OrganizationResource.new(organization, context)
          json = serializer.serialize_to_hash(org)

          render json: json, status: :created
        end
      end
    end
  end
end
