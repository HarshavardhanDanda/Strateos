module Api
  module V1
    class CompoundsController < Api::ApiController

      COMPOUND_SCHEMA = {
        type: "object", additionalProperties: false,
        properties: {
          smiles: { "type": "string" },
          pub_chem_id: { "type": "string" },
          mfcd_number: { "type": "string" },
          cas_number: { "type": "string" }
        }
      }

      COMPOUND_UPDATE_SCHEMA = {
        type: "object", additionalProperties: false, minProperties: 0,
        properties: {
          unknown: { "type": "boolean" },
          flammable: { "type": "boolean" },
          oxidizer: { "type": "boolean" },
          strong_acid: { "type": "boolean" },
          water_reactive_nucleophile: { "type": "boolean" },
          water_reactive_electrophile: { "type": "boolean" },
          general: { "type": "boolean" },
          peroxide_former: { "type": "boolean" },
          strong_base: { "type": "boolean" },
          pub_chem_id: { "type": "string" },
          mfcd_number: { "type": "string" },
          cas_number: { "type": "string" }
        }
      }

      PRIVATE_ATTRIBUTES_SCHEMA = {
        type: "object", required: [ 'compound' ], additionalProperties: false,
        properties: {
          name: { type: "string" },
          reference_id: { type: "string" },
          compound: COMPOUND_SCHEMA,
          organization_id: { type: "string" },
          external_system_id: { type: "string" },

          contextual_custom_properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" }
              },
              required: [ "key", "value" ]
            }
          },
          properties: {
            type: "object",
            additionalProperties: { "type": "string" }
          },
          labels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                organization_id: { type: "string" }
              },
              required: [ "name", "organization_id" ]
            }
          }
        }
      }

      PUBLIC_ATTRIBUTES_SCHEMA = {
        type: "object", required: [ 'compound' ], additionalProperties: false,
        properties: {
          name: { type: "string" },
          reference_id: { type: "string" },
          compound: COMPOUND_SCHEMA,

          properties: {
            type: "object",
            additionalProperties: { "type": "string" }
          },
          labels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" }
              },
              required: [ "name" ]
            }
          }
        }
      }

      CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes" ], additionalProperties: false,
        properties: {
          type: {
            type: "string"
          },
          attributes: PRIVATE_ATTRIBUTES_SCHEMA,
          actions: {
            type: "object", additionalProperties: false,
            properties: {
              dry_run: { type: "boolean" }
            }
          }
        }
      }

      PUBLIC_CREATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "attributes" ], additionalProperties: false,
        properties: {
          type: {
            type: "string"
          },
          attributes: PUBLIC_ATTRIBUTES_SCHEMA,
          actions: {
            type: "object", additionalProperties: false,
            properties: {
              dry_run: { type: "boolean" }
            }
          }
        }
      }

      CREATE_MANY_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "compounds" ], additionalProperties: false,
        properties: {
          compounds: {
            type: "array",
            items: CREATE_SCHEMA
          }
        }
      }

      PUBLIC_CREATE_MANY_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "compounds" ], additionalProperties: false,
        properties: {
          compounds: {
            type: "array",
            items: PUBLIC_CREATE_SCHEMA
          }
        }
      }

      def show
        id = params.require(:id)
        compound_link = CompoundServiceFacade::GetCompound.call(id, CompoundServiceFacade::Scope::PUNDIT_SCOPE)
        authorize(compound_link, :show?)

        respond_to do |format|
          format.sdf do
            send_data compound_link.sdf, disposition: "attachment", filename: "#{id}.sdf"
          end
          format.all do
            request = JSONAPI::RequestParser.new(
              params,
              context: context,
            )

            serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource,
              include_directives: request.include_directives,
              fields: request.fields
            )
            resource = Api::V1::CompoundResource.new(compound_link, context)
            json = serializer.serialize_to_hash(resource)
            render json: json
          end
        end
      end

      def create
        data = params.require(:data).to_unsafe_hash
        validate_json(CREATE_SCHEMA, data)

        org_id = data.dig(:attributes, :organization_id)

        compound_link = CompoundLink.new(
          organization_id: org_id
        )

        authorize(compound_link, :create?)
        create_compound(data)
      end

      def public_create
        data = params.require(:data).to_unsafe_hash
        validate_json(PUBLIC_CREATE_SCHEMA, data)

        compound_link = CompoundLink.new
        authorize(compound_link, :create_public?)
        create_compound(data)
      end

      def bulk_create
        data = params.require(:data).to_unsafe_hash
        validate_json(CREATE_MANY_SCHEMA, data)
        compounds = data[:compounds]

        organization_ids = compounds.map { |c| c.dig(:attributes, :organization_id) }.uniq

        organization_ids.each do |org_id|
          compound_link = CompoundLink.new(
            organization_id: org_id
          )
          authorize(compound_link, :create?)
        end
        create_bulk_compound(data)
      end

      def public_bulk_create
        data = params.require(:data).to_unsafe_hash
        validate_json(PUBLIC_CREATE_MANY_SCHEMA, data)

        compound_link = CompoundLink.new
        authorize(compound_link, :create_public?)

        create_bulk_compound(data)
      end

      UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [], additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              name: { type: "string" },
              reference_id: { type: "string" },

              properties: {
                type: "object",
                additionalProperties: { "type": "string" }
              },

              compound: COMPOUND_UPDATE_SCHEMA,

              external_system_id: { "type": "string" },

              contextual_custom_properties: ContextualCustomProperty::CREATE_SCHEMA,

              labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    organization_id: { type: "string, null" }
                  },
                  required: [ "name", "organization_id" ]
                }
              }
            }
          },
          actions: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              add_properties: {
                type: "object",
                additionalProperties: { "type": "string" }
              },

              delete_properties: {
                type: "array",
                items: { "type": "string" }
              },

              add_labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    organization_id: { type: "string, null" }
                  },
                  required: [ "name", "organization_id" ]
                }
              },

              delete_labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    organization_id: { type: "string, null" }
                  },
                  required: [ "name", "organization_id" ]
                }
              }
            }
          }
        }
      }

      def update
        id   = params.require(:id)
        data = params.require(:data).to_unsafe_hash

        validate_json(UPDATE_SCHEMA, data)
        response = update_compound(id, data)
        if response[:compound].present?
          serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)
          resource = Api::V1::CompoundResource.new(response[:compound], context)
          json = serializer.serialize_to_hash(resource)
          render json: json
        else
          render_api_exception(response[:error])
        end
      end

      UPDATE_MANY_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "compounds" ], additionalProperties: false,
        properties: {
          compounds: {
            type: "array",
            items: UPDATE_SCHEMA
          }
        }
      }

      def bulk_update
        response = {
          compounds: [],
          errors: nil
        }
        data = params.require(:data).to_unsafe_hash

        validate_json(UPDATE_MANY_SCHEMA, data)

        compounds = data[:compounds]
        compounds.each.with_index do |c, cp_idx|
          begin
            cp_response = update_compound(c[:id], c)
            if cp_response[:compound].present?
              response[:compounds] << cp_response[:compound][:id]
            else
              response[:errors] << cp_response[:error]
            end
          rescue => e
            Rails.logger.error(e)
            response[:errors] ||= {}
            response[:errors][cp_idx] = JSONAPI::Error.new(code: 400, status: :bad_request, title: e.message)
          end
        end

        if response[:compounds].empty?
          render json: response, status: :bad_request
        else
          render json: response
        end
      end

      PUBLIC_UPDATE_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [], additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          attributes: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              name: { type: "string" },
              reference_id: { type: "string" },

              properties: {
                type: "object",
                additionalProperties: { "type": "string" }
              },

              compound: COMPOUND_UPDATE_SCHEMA,

              labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" }
                  }
                }
              }
            }
          },
          actions: {
            type: "object", required: [], additionalProperties: false,
            properties: {
              add_properties: {
                type: "object",
                additionalProperties: { "type": "string" }
              },

              delete_properties: {
                type: "array",
                items: { "type": "string" }
              },

              add_labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" }
                  }
                }
              },

              delete_labels: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }

      def public_update
        id   = params.require(:id)
        data = params.require(:data).to_unsafe_hash

        validate_json(PUBLIC_UPDATE_SCHEMA, data)

        compound_link = CompoundLink.find(id)
        authorize(compound_link, :update_public?)

        # process actions first
        actions = data[:actions] || {}
        compound_link.properties.merge!(actions[:add_properties] || {})
        compound_link.properties.except!(*(actions[:delete_properties] || []))

        # process attributes
        compound_link.assign_attributes(data[:attributes].except(:labels).except(:compound) || {})

        # update compound properties like hazard flags and cas_number, mfcd_number, pub_chem_id
        compound_attributes = data[:attributes][:compound].dup
        excluded_fields = [ :cas_number, :pub_chem_id, :mfcd_number ]
        core_attributes = compound_attributes.slice(*excluded_fields)
        compound_link.set_core_fields_if_not_set(core_attributes, pundit_user)
        hazard_attributes = compound_attributes.except(*excluded_fields) || {}
        compound_link.update_flags(hazard_attributes)

        if compound_link.save!
          # process label actions
          compound_link.add_labels(actions[:add_labels] || {})
          compound_link.delete_labels(actions[:delete_labels] || {})

          serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)
          resource = Api::V1::CompoundResource.new(compound_link, context)
          json = serializer.serialize_to_hash(resource)

          render json: json
        else
          resource = Api::V1::CompoundResource.new(compound_link, context)
          e = JSONAPI::Exceptions::ValidationErrors.new(resource)
          render_api_exception(e)
        end
      end

      def destroy
        id    = params.require(:id)

        compound_link = CompoundServiceFacade::GetCompound.call(id, CompoundServiceFacade::Scope::PUNDIT_SCOPE)

        authorize(compound_link, :destroy?)

        compound_link = CompoundServiceFacade::DeleteCompound.call(id, CompoundServiceFacade::Scope::PUNDIT_SCOPE)

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)
        resource = Api::V1::CompoundResource.new(compound_link, context)
        json = serializer.serialize_to_hash(resource)

        render json: json
      end

      SEARCH_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "object", required: [ "compound" ], additionalProperties: false,
        properties: {
          compound:        COMPOUND_SCHEMA,
          threshold:       { type: "number", minimum: 0.5, maximum: 1.0 },
          organization_id: { type: "string" },
          public:          { type: "boolean" }
        }
      }

      def search
        data = params.require(:data).to_unsafe_hash
        validate_json(SEARCH_SCHEMA, data)
        organization_ids = []

        if data[:organization_id]
          org = Organization.find(data[:organization_id])
          authorize(org, :member?) || authorize(org, :org_is_consumer_of_allowed_labs)
          authorize(CompoundLink.new, :index?)
          organization_ids.push(data[:organization_id])
        else
          organization_ids = consuming_orgs_of_user_allowed_labs
          organization_ids.push(@organization.id).uniq!
        end

        compound_ids = []
        compound_and_score_list = {}
        organization_ids.in_groups_of(100, false).each_with_index do |org_batch, index|
          resp = CompoundService.search(
            data[:compound],
            threshold: data[:threshold],
            org_ids: org_batch,
            include_public: index == 0 ? data[:public] : false
          )
          # Find CompoundLinks for each compound found
          # It is possible to find an org and public compound link for a given compound

          compound_ids.concat(resp.map { |r|
            compound_and_score_list[r[:compound].try(:id)] = r[:score]
            r[:compound].try(:id)
          }.compact).uniq!
        end
        scope = Pundit.policy_scope!(pundit_user, CompoundLink)

        compound_links = if data[:public] && data[:organization_id]
                           scope.where(compound_id: compound_ids).by_org_and_public(data[:organization_id])
                         elsif data[:public] && !data[:organization_id]
                           scope.where(compound_id: compound_ids)
                         elsif !data[:public] && data[:organization_id]
                           scope.where(compound_id: compound_ids, organization_id: data[:organization_id])
                         else
                           scope.private_only.where(compound_id: compound_ids)
                         end

        links_by_compound = compound_links.group_by(&:compound_id)

        results = []

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)
        # map over the walter response to inject the compound links instead
        compound_and_score_list.map do |compound_and_score|
          compound_id = compound_and_score[0]
          compound_links = links_by_compound[compound_id] || []

          compound_links.each do |compound_link|
            resource = Api::V1::CompoundResource.new(compound_link, context)

            results << {
              compound: serializer.serialize_to_hash(resource),
              score: compound_and_score[1]
            }
          end
        end

        render json: results
      end

      def autocomplete_label
        org_id = params[:filter]&.dig(:organization_id)
        limit = params[:filter]&.dig(:limit)
        whereclause = { organization_id: org_id }

        if org_id
          org = Organization.find(org_id)
          authorize(org, :show_labels?)
        end

        if params[:filter]&.dig(:search)
          whereclause = { or: [ [ { organization_id: org_id }, { organization_id: nil } ] ] }
        end

        labels = Label.search(
          params.require(:q),
          fields: [ { name: :word_start } ],
          where: whereclause,
          limit: limit || 4,
          order: { _score: :desc },
          body_options: { min_score: 1 }
        )
        json = labels.map { |l| { id: l.id, name: l.name, organization_id: l.organization_id } }.uniq
        render json: json
      end

      RELATIONSHIP_SCHEMA = {
        "$schema" => "http://json-schema.org/draft-04/schema#",
        type: "array",
        items: {
          type: "object", required: [ "type", "id" ], additionalProperties: false,
          properties: {
            type: { type: "string" }, id: { type: "string" }
          }
        }
      }

      def create_relationship
        id = params.require(:compound_id)
        data = params.require(:data).map(&:to_unsafe_h)
        compound = CompoundLink.find(id)

        library_ids = extract_library_ids(compound, data)

        existing_library_ids = compound.libraries.pluck(:id)

        library_ids.each_with_index do |library_id, idx|
          if existing_library_ids.include?(library_id)
            message = "Library with id '#{library_id}' is already associated with this compound"
            return render_error("Conflict", status: :conflict, code: "409", detail: message)
          end
        end

        assign_libraries(compound, existing_library_ids + (library_ids - existing_library_ids))
      end

      def destroy_relationship
        id = params.require(:compound_id)
        data = params.require(:data).map(&:to_unsafe_h)
        compound = CompoundLink.find(id)

        library_ids = extract_library_ids(compound, data)

        not_associated_library_ids = library_ids - compound.libraries.pluck(:id)

        if (count = not_associated_library_ids.count) > 0
          error_message = "Library#{count > 1 ? 's' : ''} with id#{count > 1 ? 's' : ''}: "\
                          "'#{not_associated_library_ids.join(', ')}' "\
                          "#{count > 1 ? 'are' : 'is'} not associated to compound '#{id}'"
          return render_error("Invalid request", status: :bad_request, code: "400", detail: error_message)
        end

        assign_libraries(compound, compound.libraries.pluck(:id) - library_ids)
      end

      private

      def extract_library_ids(compound, data)
        validate_json(RELATIONSHIP_SCHEMA, data)
        authorize(compound, :show?)
        library_ids = data.present? ? data.pluck(:id) : []
        library_ids.each { |id| authorize(Library.find(id), :update?) }
        library_ids
      end

      def assign_libraries(compound, library_ids)
        compound.libraries = library_ids.map { |id| Library.find(id) }
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource, include: [ 'libraries' ])
        compound = Api::V1::CompoundResource.new(compound, context)
        json = serializer.serialize_to_hash(compound)

        render json: json, status: [ 'create', 'create_relationship' ].include?(self.action_name) ? :created : :ok
      end

      def update_compound(id, data)
        # Authorization occurs in `compound_link.update_compound` because
        # it depends on what is being updated (e.g. only external system ID).

        CompoundServiceFacade::UpdateCompound.call(id, data, pundit_user)
      end

      def create_compound(data)
        serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)

        if data.dig(:actions, :dry_run)
          compound_summary = CompoundLink.build_compound_links([ data ], current_user.id).first
          resource = Api::V1::CompoundResource.new(compound_summary, context)
          response = serializer.serialize_to_hash(resource)
          return render json: response
        end

        compound_link = CompoundServiceFacade::CreateCompounds.call([ data ])

        if compound_link[:created].empty?
          resource = Api::V1::CompoundResource.new(compound_link[:errored].first, context)
          e = JSONAPI::Exceptions::ValidationErrors.new(resource)
          render_api_exception(e)
        else
          resource = Api::V1::CompoundResource.new(compound_link[:created].first, context)
          response = serializer.serialize_to_hash(resource)
          render json: response
        end
      end

      def create_bulk_compound(data)
        compounds = data[:compounds]

        request = {
          summarize: [],
          create: []
        }

        response = {
          compounds: [],
          errors: []
        }

        compounds.each do |compound|
          if compound.dig(:actions, :dry_run)
            request[:summarize].append(compound)
          else
            request[:create].append(compound)
          end
        end

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::CompoundResource)

        unless request[:summarize].empty?
          compound_summaries = CompoundLink.build_compound_links(request[:summarize],
                                                                 current_user.id)
          compound_summaries.each do |compound_summary|
            resource = Api::V1::CompoundResource.new(compound_summary, context)
            response[:compounds].append(serializer.serialize_to_hash(resource))
          end
        end

        unless request[:create].empty?
          compound_links = CompoundServiceFacade::CreateCompounds.call(request[:create])
          created_compound_links = compound_links[:created]
          errored_compound_links = compound_links[:errored]

          created_compound_links.each do |compound_link|
            resource = Api::V1::CompoundResource.new(compound_link, context)
            response[:compounds].append(serializer.serialize_to_hash(resource))
          end

          errored_compound_links.each do |compound_link|
            exception = ActiveModel::ValidationError.new(compound_link)
            e = JSONAPI::Error.new(code: JSONAPI::VALIDATION_ERROR, status: :unprocessable_entity,
                                   title: exception.message)
            response[:errors].append(e)
          end
        end
        render json: response
      end
    end
  end
end
