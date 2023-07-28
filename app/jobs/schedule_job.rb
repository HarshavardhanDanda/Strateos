# Initiates a call to tcle to add some autoprotocol to
# a workcell's queue
class ScheduleJob
  include Sidekiq::Worker

  def perform(*args)
    if args.length == 2
      request(args[0], args[1])
    else
      group_request(*args)
    end
  end

  # Initiate the request
  # @param request_id [String] The id of the ScheduleRequest
  # @param service_url [String] ams service url
  # @return void
  def request(request_id, service_url)
    req = ScheduleRequest.find(request_id)
    return if req.aborted?

    req.update status: 'processing'

    # Expected answer: { success: <boolean>, message: <optional: string > }
    if service_url
      mcx_client = McxClient.new
      res = mcx_client.submit_run(service_url, req.workcell_id, req.request)
      res = JSON.parse(res, symbolize_names: true)
    else
      tcle_service = find_tcle_service(req.workcell_id)
      res = tcle_service.queue_run(req.workcell_id, req.request)
    end

    if res.nil? or !res[:success]
      # destroy execution and tiso reservations if failed.
      run_ex_id = RunExecution.extract_execution_id(req.request["run"]["run_id"])

      # run_ex_id won't exist for test schedules
      if run_ex_id
        ReservationManager.complete_run_execution(run_ex_id)
      end

      if res.nil?
        req.update status: 'failed', result: { success: false, message: "No message from TCLE" }
      else
        req.update status: 'failed', result: res
      end
    else
      req.run&.start! if req.run.present? && req.run.started_at.nil?
      req.update status: 'success', result: res
    end
  end

  def group_request(workcell_id, runs_workcell_json, request_ids, aggregateRuns)
    tcle_service = find_tcle_service(workcell_id)
    payload = {
      runs: runs_workcell_json,
      aggregateRuns: aggregateRuns,
      requestId: request_ids[0].to_s
    }

    # BooleanResponse(success: Boolean, message: Option[String] = None)
    responses = tcle_service.queue_run_group(workcell_id, payload)
    if responses.kind_of?(Array) # correct response, responses is an array of BooleanResponse
      responses.each_with_index do |res, index|
        req = ScheduleRequest.find(request_ids[index])
        status =
          if res.nil? or !res[:success]
            "failed"
          else
            req.run&.start! if req.run.present? && req.run.started_at.nil?
            "success"
          end
        req.update status: status, result: res
      end
    else
      # if there is a timeout or a serialization issue, responses is nil or a single BooleanResponse
      request_ids.each do |rid|
        req = ScheduleRequest.find(rid)
        if responses.nil?
          req.update status: 'failed', result: { success: false, message: "No message from TCLE" }
        else
          req.update status: 'failed', result: responses
        end
      end
    end
  end
end
