module Api
  module V1
    module VendorCatalogService
      class VendorCatalogsController < UserBaseController
        before_action :camelize_params

        def compounds
          authorize(@organization, :member?)

          response = VENDOR_CATALOG_SERVICE.compounds(pundit_user.user, @organization, @data)
          render json: response.body, status: response.code
        end

        def flattened_compounds
          authorize(@organization, :member?)

          begin
            response = VENDOR_CATALOG_SERVICE.compounds(pundit_user.user, @organization, format_request(@data))
            render json: format_response(response, @data), status: response.code
          rescue StandardError => e
            return render json: { errors: [ e.message ] }, status: :bad_request
          end
        end

        private

        def format_request(request)
          if !request[:filter] || !request[:filter].key?(:smiles)
            raise "Invalid request: request must contain smiles filter"
          end
          smiles = request[:filter][:smiles]

          {
            vendor: "EMOLECULES",
            searchType: "EXACT",
            smiles: smiles
          }.as_json
        end

        def format_response(response, request)
          if response.code != 200 && response.code != '200'
            { errors: [ response.body ] }
          else
            similarity = request[:filter][:similarity]
            body = JSON.parse response.body
            compounds = body['content'] || []

            filtered_compounds = case similarity
            when 'all'
              compounds
            when 'exact'
              exact_compounds = find_exact_compounds(compounds, request[:filter][:smiles])
              exact_compounds || []
            when 'similar'
              compounds - find_exact_compounds(compounds, request[:filter][:smiles])
            else
              raise "Invalid similarity filter: #{similarity}"
            end

            result = flatten_supplier_price_points(filtered_compounds)
            {
              data: result.map { |compound|
                {
                  attributes: compound
                }
              },
              meta: {
                record_count: result.size
              }
            }
          end
        end

        def flatten_supplier_price_points(compounds)
          flattened_compounds = []

          compounds.each { |compound|
            compound['suppliers'].each { |supplier|
              supplier['pricePoints'].each { |pricePoint|
                compound = compound.except('suppliers')
                supplier = supplier.except('pricePoints')

                compound[:supplier] = supplier.merge(pricePoint)
                flattened_compounds << compound
              }
            }
          }

          flattened_compounds
        end

        def find_exact_compounds(compounds, smiles)
          compounds&.select { |compound|
            smiles == compound['smiles']
          }
        end

        def camelize_params
          data = params.to_unsafe_hash
          @data = data.except(:controller, :action)
          @data.deep_transform_keys! { |key| key.camelize(:lower) }
        end
      end
    end
  end
end
