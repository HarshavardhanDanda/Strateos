module Api
    module V1
      class StaleContainersController < Api::ApiController
        def index
          authorize( StaleContainer.new, :index?)

          q         = params[:q]         || '*'
          order_by  = params[:order_by]  || :_score
          direction = params[:direction] || :desc
          per_page  = params[:per_page]  || 10
          page      = params[:page]      || 1

          where = {
            _not: {
              container_status: Container::STATUS_DESTROYED
            },
            admin_flagged_for_extension_at: nil,
            lab_id: lab_ids_by_feature(MANAGE_STALE_CONTAINERS)
          }

          request = StaleContainer.search(
              q,
              per_page: per_page,
              page:     page,
              order:    { order_by => direction },
              where:    where,
              match:    :word_start
            )

          render json: {
            results:   request.results.map(&:search_data),
            num_pages: request.num_pages,
            per_page:  request.per_page
          }
        end

        UPDATE_SCHEMA={
          "$schema": "http://json-schema.org/draft-04/schema#",
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "admin_flagged_for_notification_at": {
              "type": "integer"
            },
            "admin_flagged_for_extension_at": {
              "type": "integer"
            },
            "stale_container": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "admin_flagged_for_notification_at": {
                  "type": "integer"
                },
                "admin_flagged_for_extension_at": {
                  "type": "integer"
                },
              },
              "required": [ "id" ]
            }
          },
          "required": [
            "id",
            "stale_container"
          ]
        }

        def update
          stale = params.to_unsafe_hash

          validate_json(UPDATE_SCHEMA, stale)

          stale_container = StaleContainer.find(params.require(:id));

          authorize( stale_container, :update?)

          update =
            if params[:admin_flagged_for_notification_at]
              stale_container.flag_for_notification
            elsif params[:admin_flagged_for_extension_at] || params[:requested_extension_at]
              stale_container.flag_for_extension
            end

          if update
            render json: stale_container
          else
            render json: stale_container.errors, status: :unprocessable_entity
          end
        end

      end
    end
end
