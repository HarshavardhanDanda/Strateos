require 'json'
require 'googleauth'
require 'google/apis/sheets_v4'

class SlackMessageForFlaggedTransfersJob
  include Sidekiq::Worker

  NUM_RETRIES = 5
  sidekiq_options(retry: NUM_RETRIES)

  sidekiq_retries_exhausted do |msg|
    raise "Failed to create slack message after #{NUM_RETRIES} retries. " \
          "#{msg['class']} with #{msg['args']}: #{msg['error_message']}"
  end

  SLACK_CHANNEL = '#transfer-flag-logs'
  ICON_EMOJI = ':boba:'
  FORM_URL = 'https://goo.gl/VEjLm6'

  def post_to_slack(container_id, run_title, execution_workcell)
    container = Container.with_deleted.find_by_id(container_id)
    container_link = "https://secure.transcriptic.com/admin/supply-chain/containers/#{container_id}"
    container_label = "<#{container_link}|#{container.label} (#{container_id})>"

    container_location = container.location
    location_label = container_location ? container_location.human_path : 'unknown location'

    attached_message = {
      fallback: container_label,
      fields: [
        { title: "Container", value: container_label },
        { title: "Location", value: location_label },
        { title: "Form", value: FORM_URL }
      ]
    }

    payload = {
      channel: SLACK_CHANNEL,
      username: run_title,
      icon_emoji: ICON_EMOJI,
      attachments: [ attached_message ]
    }

    if execution_workcell.start_with?('wc0', 'wc3')
      return NoOpHTTPClient.post(SLACK_HOOK_URL, { payload: payload.to_json })
    end

    SLACK_CLIENT.ping(payload)
  end

  def populate_google_form(values, execution_workcell)
    spreadsheet_id = '1B89RaMTsVPeAHFHodiMPB0kLe03lYP2981ju7d9NcOg'
    sheet_name = 'Sheet1' # hardcoded value for now

    request_body = Google::Apis::SheetsV4::ValueRange.new

    # Values will be appended after the last row of the table.
    range = "#{sheet_name}!A:D" # This is currently hardcoded. Please update if the return changes
    value_input_option = 'USER_ENTERED'
    insert_data_option = 'INSERT_ROWS'

    request_body.range = range
    request_body.values = values
    request_body.major_dimension = "ROWS"

    if !Rails.env.production? || execution_workcell.start_with?('wc0', 'wc3')
      info = <<~EOF
        "Would have sent the following body to Google:
          Spreadsheet Id:   #{spreadsheet_id}
          Range:            #{range}
          Request Body:     #{request_body}
          Value Input:      #{value_input_option}
          Data Input:       #{insert_data_option}
      EOF
      Rails.logger.info(info)
    else
      # This implicitly uses the GOOGLE_ACCOUNT_TYPE, GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables
      authorization = Google::Auth.get_application_default(Google::Apis::SheetsV4::AUTH_SPREADSHEETS)

      # Initialize the API
      service = Google::Apis::SheetsV4::SheetsService.new
      service.authorization = authorization

      service.append_spreadsheet_value(spreadsheet_id, range, request_body,
                                       value_input_option: value_input_option,
                                       insert_data_option: insert_data_option)
    end
  end

  # Note that Google is expecting an array of opaque strings and ints
  def generate_sheet_values(run_id, container_id, well_idx)
    aliquot = Aliquot.find_by(container_id: container_id, well_idx: well_idx)
    human_idx = Container.find_by_id(container_id).container_type.human_well(well_idx)

    # Round the sensed values for sanity. (Once TCLE rounding lands, we should not need this)
    actual_vol = aliquot.volume_ul.round(2)

    admin_container_link = "https://secure.transcriptic.com/admin/supply-chain/containers/#{container_id}"
    container_label = "=HYPERLINK(\"#{admin_container_link}\", \"#{container_id}\")"

    run_label = "=HYPERLINK(\"https://secure.transcriptic.com/-/#{run_id}\", \"#{run_id}\")"

    [ run_label, container_label, human_idx, actual_vol ]
  end

  def perform(run_execution_id)
    run_execution = RunExecution.find(run_execution_id)
    execution_workcell = run_execution.workcell_id

    run = run_execution.run
    run_id = run.id

    relevant_insts = run_execution.instruction_ids
    liquid_sensing_effects = AliquotEffect.where(generating_instruction_id: relevant_insts,
                                                 effect_type: 'liquid_sensing')

    return if liquid_sensing_effects.empty?

    unique_aliquots = liquid_sensing_effects.pluck(:affected_container_id, :affected_well_idx).uniq
    values = unique_aliquots.map { |(container_id, well_idx)| generate_sheet_values(run_id, container_id, well_idx) }

    if values.present?
      populate_google_form(values, execution_workcell)
      unique_containers = unique_aliquots.map { |(container_id, _)| container_id }.uniq

      # Only run the job for non-discarded containers
      non_discard_container_ids = Ref.where(container_id: unique_containers)
                                     .reject { |ref| ref.destiny == { "discard" => true } }
                                     .map(&:container_id)

      if non_discard_container_ids.empty?
        Rails.logger.info("[SlackMessageForFlaggedTransfersJob] not performed due to lack of non-discard containers.")
        return
      end

      # Only run the job for non 6-flats for now (since they are only used as Agar-plates currently)
      non_6_flat_container_ids = Ref.where(container_id: non_discard_container_ids)
                                    .reject { |ref| ref.new_container_type == "6-flat" }
                                    .map(&:container_id)

      return if non_6_flat_container_ids.empty?

      non_6_flat_container_ids.map do |container_id|
        post_to_slack(container_id, run.title, execution_workcell)
      end
    else
      Bugsnag.notify(
        "Unable to generate values to populate google form or send slack message for liquid sensing",
        severity: 'warning',
        run_execution_id: run_execution_id
      )
    end
  rescue => e
    Bugsnag.notify(e, severity: 'warning', run_execution_id: run_execution_id)
    error_msg = "Error creating liquid sensing slack message for run execution id #{run_execution_id}. #{e}"
    raise SidekiqRetriableError.new(error_msg)
  end
end
