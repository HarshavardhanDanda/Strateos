module Api
  module V1
    class ContextualCustomPropertiesController < Api::ApiController

      def create_or_update
        run_id           = params[:run_id]
        aliquot_id       = params[:aliquot_id]
        container_id     = params[:container_id]
        compound_link_id = params[:compound_id]
        batch_id         = params[:batch_id]
        value            = params[:value]

        context = if run_id.present?
                    Run.find(run_id)
                  elsif aliquot_id.present?
                    Aliquot.find(aliquot_id)
                  elsif container_id.present?
                    Container.find(container_id)
                  elsif compound_link_id.present?
                    CompoundServiceFacade::GetCompound.call(compound_link_id)
                  elsif batch_id.present?
                    Batch.find(batch_id)
                  else
                    raise ActionController::BadRequest(
                      "Missing context, one of the required param (run_id,aliquot_id,container_id,compound_id,batch_id)
                       must be passed"
                    )
                  end
        config = ContextualCustomPropertiesConfig.find_by!(
          key: params.require(:key),
          organization: @organization,
          context_type: context.class.name
        )

        ccp = ContextualCustomProperty.find_or_initialize_by(contextual_custom_properties_config: config,
                                                             context: context)
        ccp.value = value

        authorize(ccp, :create_or_update?)

        if ccp.save
          if context.class.name != 'Batch'
            context.reindex()
          end
          render json: ccp.as_json(ContextualCustomProperty::FULL_JSON)
        else
          render json: ccp.errors, status: :unprocessable_entity
        end

      end
    end
  end
end
