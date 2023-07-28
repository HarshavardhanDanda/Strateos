module Api
  module V1
    class UsersController < Api::ApiController

      def search
        authorize(User.new, :search?)
        q         = params.fetch(:q, '*')
        order_by  = params.fetch(:order_by, :_score)
        direction = params.fetch(:direction, :asc)
        per_page  = params.fetch(:per_page, 10)
        page      = params.fetch(:page, 1)
        where     = {}
        is_collaborator = params.fetch(:is_collaborator, false)

        if is_collaborator.present? && is_collaborator.to_s.downcase == 'true'
          where = {
            organizations: {
              _not: nil
            }
          }
        end

        request = User.search(
          q,
          per_page: per_page,
          page:     page,
          order:    { order_by => direction },
          where:    where,
          fields:   [ :id, :email, :name ], match: :word_start,
          misspellings: false
        )

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::UserResource, include: [ 'organizations' ])
        resources = request.map { |a| Api::V1::UserResource.new(a, context) }
        json = serializer.serialize_to_hash(resources)

        json[:meta] = {
          record_count: request.total_count
        }

        render json: json
      end

      def reset_second_factor_attempts
        user = User.find(params.require(:id))
        authorize(current_user, :manage_users_global?)
        user.update(second_factor_attempts_count: 0)
        render json: user
      end

      def disable_2fa
        user = User.find(params.require(:id))
        authorize(current_user, :manage_users_global?)
        user.update(two_factor_auth_enabled: false)
        render json: user
      end

      def force_password_reset
        user = User.find(params.require(:id))
        authorize(current_user, :manage_users_global?)
        if !user.force_change_password
          user.update(force_change_password: true)
          # sends email to user
          user.send_reset_password_instructions
          render json: user
        else
          return render json: { error: 'Force Password Reset Request has already been made for this user' },
                        status: :bad_request
        end
      end

      def scheduler_stats
        # currently hard code scheduler stats to TX scheduler.
        response = TCLE_SERVICE.scheduler_stats

        if response.nil?
          render json: { error: { message: "No message from TCLE" }}, status: :service_unavailable
        else
          render json: response
        end
      end

    end
  end
end
