module IgorService
  module_function

  def execute_protocol_from_s3(command_string, s3_bucket, s3_path, inputs)
    s3_url = S3Helper.instance.url_for(s3_bucket, s3_path, expires_in: 10.minutes.to_i)
    execute_protocol(command_string, s3_url, inputs)
  end

  def execute_protocol(command_string, source_url, inputs)
    timeout = 60 * 10 # 10 minutes
    resp, protocol_response = self.post(command_string, source_url, inputs, timeout)

    begin
      protocol_json = JSON.parse(protocol_response)
    rescue JSON::JSONError => e
      Rails.logger.error "Error parsing Igor autoprotocol: #{e}"
      return { success: false, autoprotocol: nil, outputs: nil, raw_response: resp.body }
    end

    # The response is expected to be a JSON object in one of two formats:
    # 1. Valid autoprotocol
    #   { refs: {}, instructions: {} }
    # 2. A JSON Object with autoprotocol and outputs fields.  The autoprotocol field is
    # the exact same as format #1, but it is nested within the JSON object.
    #   {
    #     autoprotocol: { refs: {}, instructions: {} },
    #     outputs: {x: 1 }
    #   }
    if protocol_json.key?('autoprotocol') and protocol_json.key?('outputs')
      autoprotocol = protocol_json['autoprotocol']
      outputs      = protocol_json['outputs']
    else
      autoprotocol = protocol_json
      outputs      = nil
    end

    {
      success: true,
      raw_response: resp.body,
      autoprotocol: autoprotocol,
      outputs: outputs
    }
  end

  def execute_program(program_execution)
    program = program_execution.program
    user    = program_execution.user
    inst    = program_execution.instruction
    run     = program_execution.run || inst.run

    env_vars = {
      API_ROOT: ENV['RAILS_SERVER_URL'],
      TX_RUN_ID: run.id,
      TX_INSTRUCTION_ID: inst ? inst.id : nil,
      TX_AUTH_TOKEN: user.authentication_token,
      TX_EMAIL: user.email,
      TX_ORG_ID: run.project.organization_id,
      TX_ORG_SUBDOMAIN: run.project.organization.subdomain
    }

    _, res = self.post(program.command, program.url, {}, 180, env_vars)
    res
  end

  def post(command_string, source_url, inputs, timeout, env_vars = {})
    begin
      Rails.logger.info "Sending request to protocol runner (#{PROTOCOL_RUNNER_URL})...."
      resp = Excon.post(PROTOCOL_RUNNER_URL, {
        body: {
          url: source_url,
          parameters: inputs,
          commandString: command_string,
          envVars: env_vars,
          timeout: timeout
        }.to_json,

        headers: { 'Content-Type' => 'application/json' },
        connect_timeout: 5,
        write_timeout: 60,
        read_timeout: timeout
      })
    rescue Excon::Error => e
      Rails.logger.error "Unable to post to #{PROTOCOL_RUNNER_URL}"
      raise e
    end
    # MINOR HACK:
    # Since the stdout is not quieted on Igor we must ignore the response
    # body up until the transcriptic compile method call begins.
    script_output = resp.body.gsub(%r{.*^\+.*?bash -c .*/tmp/params.json.*?(\n|$)}m, '')

    [ resp, script_output ]
  end
end
