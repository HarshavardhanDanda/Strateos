module Api
  module V1
    class ChemicalReactionsController < UserBaseController
      def create_reaction
        authorize(@organization, :member?)

        return render json: { errors: "Not authorized" }, status: :forbidden unless has_feature_in_org?(CREATE_REACTION)

        response = CHEMICAL_REACTION_SERVICE.create_reaction(pundit_user.user, @organization, request.raw_post)
        render json: response.body, status: response.code
      end

      def get_reaction
        authorize(@organization, :member?)

        reaction_id = params.require(:id)
        organization = Batch.find_by_reaction_id!(reaction_id).organization

        unless scoped_org_ids.include?(organization.id)
          raise JSONAPI::Exceptions::RecordNotFound.new(reaction_id)
        end

        response = CHEMICAL_REACTION_SERVICE.get_reaction(pundit_user.user, organization, reaction_id)
        render json: response.body, status: response.code
      end

      def submit_reaction
        authorize(@organization, :member?)

        return render json: { errors: "Not authorized" },
status: :forbidden unless has_feature_in_org?(EDIT_SUBMIT_REACTION)

        response = CHEMICAL_REACTION_SERVICE.submit_reaction(pundit_user.user, @organization, params.require(:id))
        render json: response.body, status: response.code
      end

      def update_reaction
        authorize(@organization, :member?)

        return render json: { errors: "Not authorized" },
status: :forbidden unless has_feature_in_org?(EDIT_SUBMIT_REACTION)

        response = CHEMICAL_REACTION_SERVICE.update_reaction(pundit_user.user, @organization, params.require(:id),
request.raw_post)
        render json: response.body, status: response.code
      end

      def update_reactant
        authorize(@organization, :member?)

        return render json: { errors: "Not authorized" },
status: :forbidden unless has_feature_in_org?(EDIT_SUBMIT_REACTION)

        response = CHEMICAL_REACTION_SERVICE.update_reactant(pundit_user.user, @organization, params.require(:id),
params.require(:reactant_id), request.raw_post)
        render json: response.body, status: response.code
      end

      def get_reactions
        authorize(@organization, :member?)

        scoped_org_ids_list = scoped_org_ids
        if params.key?(:run_id) && params.key?(:ids)
          return render json: { errors: "Parameters 'run_id' and 'ids' are not allowed simultaneously" },
                        status: :bad_request
        elsif params.key?(:run_id)
          run_id = params.require(:run_id)
          run = Run.find(run_id)
          unless scoped_org_ids_list&.include? run.organization&.id
            raise JSONAPI::Exceptions::RecordNotFound.new(run_id)
          end
          response = CHEMICAL_REACTION_SERVICE.get_reactions(pundit_user.user, @organization, run_id)
        elsif params.key?(:ids)
          responses = []
          errors = []
          org_to_reaction_ids = Batch.where(reaction_id: params.require(:ids).split(','),
                                            organization_id: scoped_org_ids_list)
                                     .group("organization_id")
                                     .select("organization_id, array_agg(reaction_id) AS reaction_ids")
                                     .map { |b| [ Organization.find(b.organization_id), b.reaction_ids ] }.to_h

          org_to_reaction_ids.each do |org, reaction_ids|
            response = CHEMICAL_REACTION_SERVICE.get_reactions_by_ids(pundit_user.user,
                                                                      org,
                                                                      reaction_ids.join(','))
            if response.code.to_i == 200
              responses += JSON.parse(response.body)
            else
              errors << JSON.parse(response.body)
            end
          rescue StandardError => e
            errors << e
          end
          return render json: { reactions: responses, errors: errors }
        end

        render json: response.body, status: response.code
      end

      private

      def scoped_org_ids
        if has_feature_in_org?(GET_REACTION) && has_feature_in_any_lab(VIEW_REACTIONS_IN_LAB)
          consumer_org_ids = get_consumer_orgs_of_lab_with_feature(VIEW_REACTIONS_IN_LAB)
          consumer_org_ids.concat([ @organization.id ])
        elsif has_feature_in_org?(GET_REACTION)
          [ @organization.id ]
        elsif has_feature_in_any_lab(VIEW_REACTIONS_IN_LAB)
          get_consumer_orgs_of_lab_with_feature(VIEW_REACTIONS_IN_LAB)
        else
          raise Pundit::NotAuthorizedError
        end
      end
    end
  end
end
