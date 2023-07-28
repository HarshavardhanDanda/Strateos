module Api
  module V1
    class ContainerDestructionRequestsController < Api::ApiController
      def index
        authorize(ContainerDestructionRequest.new, :index?)
        q         = params[:q]         || '*'
        order_by  = params[:order_by]  || :_score
        direction = params[:direction] || :desc
        per_page  = params[:per_page]  || 10
        page      = params[:page]      || 1

        request = ContainerDestructionRequest.search(
          q,
          per_page: per_page,
          page:     page,
          order:    { order_by => direction },
          fields:   [ :container_id, :barcode ], match: :word_start,
          where:    {
            status: Container::STATUS_PENDING_DESTROY,
            lab_id: lab_ids_by_feature(MANAGE_CONTAINER_DESTRUCTION_REQUESTS)
          }
        )
        render json: {
          results:   request.results.map(&:search_data),
          num_pages: request.num_pages,
          per_page:  request.per_page
        }
      end
    end
  end
end
