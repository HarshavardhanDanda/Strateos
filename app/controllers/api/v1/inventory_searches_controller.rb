module Api
  module V1
    class InventorySearchesController < Api::ApiController
      def create
        attrs = params.require(:data)[:attributes] || {}
        if current_user
          authorize(Container.new, :index?)
        end
        request, search_scores = InventorySearchesService.call(attrs, pundit_user)
        container_ids       = request.results.map { |r| r[:id] }
        unsorted_containers = Container.with_deleted.find(container_ids)
        compound = attrs[:compound]
        includes = attrs[:include] || []

        # preserve elastic search ordering
        id_to_container = unsorted_containers.group_by(&:id)
        containers      = container_ids.map { |i| id_to_container[i].first }

        serializer = JSONAPI::ResourceSerializer.new(Api::V1::ContainerResource, include: includes)
        resources  = containers.map { |ct| Api::V1::ContainerResource.new(ct, context) }
        json       = serializer.serialize_to_hash(resources)

        json[:meta] = {
          record_count: request.total_count
        }

        # add aliquot_count from elasticsearch results
        json[:data].each do |d|
          result = request.results.find { |r| r[:id] == d['id'] }
          d["attributes"]["aliquot_search_scores"] = []
          if !current_user || has_feature_in_any_lab(MANAGE_CONTAINERS_IN_LAB)
            d['attributes']['location'] = containers.find { |r| r[:id] == d['id'] }
                                                    .location.as_json(Location.short_json)
          end
          if compound && compound[:exact_match] == 'false'
            aliquot_compound_scores = InventorySearchesService.aliquot_compound_scores(result, search_scores)
            d["attributes"]["aliquot_search_scores"].push(*aliquot_compound_scores)
          end
        end

        render json: json
      end
    end
  end
end
