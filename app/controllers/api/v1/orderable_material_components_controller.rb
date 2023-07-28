module Api
  module V1
    class OrderableMaterialComponentsController < Api::ApiController

      def global_stats

        omc_id = params.require(:id)
        applicable_containers = Container.joins(:aliquots)
                                         .where(organization_id: nil,
                                                test_mode: false)
                                         .where("expires_at is null OR expires_at > ?", Time.now)

        grouped_containers =
          if omc_id.nil?
            applicable_containers
              .where.not(orderable_material_component_id: nil)
              .group(:orderable_material_component_id)
          else
            applicable_containers
              .where(orderable_material_component_id: omc_id)
              .group(:orderable_material_component_id)
          end

        counts = grouped_containers.size
        masses = grouped_containers.sum('aliquots.mass_mg')
        volumes = grouped_containers.sum('aliquots.volume_ul')
        counts_and_volumes = counts.merge(volumes) do |omatc_id, count, volume|
          { id: omatc_id, stock_count: count, stock_volume: volume }
        end

        global_stats = counts_and_volumes.merge(masses) do |omatc_id, count_and_volume, mass|
          {
            id: omatc_id,
            stock_count: count_and_volume[:stock_count],
            stock_volume: count_and_volume[:stock_volume],
            stock_mass: mass
          }
        end

        render json: global_stats.values
      end
    end
  end
end
