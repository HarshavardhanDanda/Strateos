# Background job to send a LaunchRequest to Igor to get autoprotocol
# Mutates the LaunchRequest to attach either valid autoprotocol or errors
class ProtocolLaunchJob
  include Sidekiq::Worker
  sidekiq_options queue: "critical"

  def perform(request_id)
    request  = LaunchRequest.find request_id
    protocol = request.protocol

    request.update!(progress: 25)

    # validate user inputs
    errors = ManifestUtil.validate_inputs(request.raw_input, protocol.inputs)
    if not errors.empty?
      return log_error(
        request,
        "BAD_INPUTS",
        errors
      )
    end

    begin
      inputs = LaunchRequest.inputs_for_parameters(
        request.organization, protocol.inputs, request.raw_input
      )
    rescue MissingContainersError => error
      return log_error(
        request,
        "MISSING_CONTAINER",
        error.message
      )
    rescue MissingCompoundsError => error
      return log_error(
        request,
        "MISSING_COMPOUND",
        error.message
      )
    rescue StandardError => error
      return log_error(
        request,
        "UNKNOWN_ERROR",
        error.message
      )
    end
    request.update(inputs: inputs)

    request.update!(progress: 70)

    unless Rails.env.test?

      # Fetch autoprotocol and outputs
      igor_resp = IgorService.execute_protocol_from_s3(
        protocol.command_string,
        protocol.release.bucket,
        protocol.release.binary_attachment_url,
        request.inputs
      )

      # Log raw response if igor returns a bad response.
      if not igor_resp[:success]
        return log_error(
          request,
          "BAD_JSON",
          "Protocol error: failed to generate a valid JSON response. See the info below for details.",
          igor_resp[:raw_response]
        )
      end

      # save autoprotocol to launch request.
      request.autoprotocol = igor_resp[:autoprotocol]
      request.outputs      = igor_resp[:outputs] if !igor_resp[:outputs].nil?

      request.update!(progress: 80)

      # Log errors returned from generated autoprotocol.
      if request.autoprotocol['errors']
        errors = request.autoprotocol['errors']

        unless errors.kind_of?(Array) and errors.all? { |e| e.kind_of?(Hash) and e['message'].kind_of? String }
          return log_error(
            request,
            "BAD_ERRORS",
            "Protocol error: protocol generated errors, but incorrectly.",
            request.autoprotocol
          )
        end

        request.generation_errors = errors.map do |error|
          {
            code: "PROTOCOL_ERROR",
            message: error['message'],
            info: error['info']
          }
        end

        request.progress = 100
        request.save
        return
      end

      # Create a run and set the autoprotocol,
      # which automatically parses and checks the autoprotocol.
      run           = Run.new
      run.test_mode = request.test_mode
      run.owner     = request.user

      ## TODO Below line need to be revisited. We must have lab association to launch_request as well.
      # Use `lab` from launch_request instead of `organization.labs.first`
      run.lab = request.organization.labs.first

      # We must provide organization context to run ahead of calling `run.protocol`
      project = Project.new
      project.organization = request.organization
      run.project = project

      run.protocol = request.autoprotocol

      # Log parser or checker errors on the autoprotocol.
      unless run.errors[:protocol].empty?
        errors_str = run.errors[:protocol].map { |e| e[:message].to_s }.join(', ')

        return log_error(
          request,
          "BAD_PROTOCOL",
          "Your request generated malformed autoprotocol: #{errors_str}"
        )
      end

      # validate the autoprotocol outputs
      output_errors =
        if protocol.outputs and not protocol.outputs.empty?
          ManifestUtil.validate_outputs(request.outputs, protocol.outputs, request.autoprotocol)
        else
          []
        end

      if not output_errors.empty?
        errors_str = output_errors.join(', ')

        return log_error(
          request,
          "BAD_PROTOCOL",
          "Your request generated malformed autoprotocol outputs: #{errors_str}"
        )
      end

      request.update(progress: 100, validated_at: Time.now)
    end
  end

  def log_error(launch_request, code, message, info = nil)
    error =
      if info.present?
        { code: code, message: message, info: info }
      else
        { code: code, message: message }
      end

    launch_request.generation_errors = [ error ]
    launch_request.progress = 100
    launch_request.save
  end
end
