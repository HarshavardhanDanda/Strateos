module Api
  module V1
    class WorkcellsController < Api::ApiController
      def sessions
        workcell_id = params.require(:id)
        workcell = Workcell.find_by(workcell_id: workcell_id)
        if workcell.nil?
          return render json: { error: "Workcell Not Found" }.to_json, status: 404
        end
        if workcell.test_workcell.nil?
          return render json: { error: "No Test Workcell For #{workcell.name}" }.to_json, status: 404
        end
        test_workcell = Workcell.find(workcell.test_workcell)
        if test_workcell.nil?
          return render json: { error: "Test Workcell Not Found" }.to_json, status: 404
        end
        tcle_service = find_tcle_service(test_workcell.workcell_id)
        session_list = tcle_service.session_list(test_workcell.node_id)
        if session_list.nil?
          render json: { error: "Rabbit Timeout" }.to_json, status: 408
        elsif session_list[:list].nil?
          render json: { error: "Invalid Value" }.to_json, status: 408
        else
          render json: {
            list: session_list[:list].select { |item| item[:mcxId].nil? || item[:mcxId] == workcell.node_id }
          }
        end
      end
    end
  end
end
