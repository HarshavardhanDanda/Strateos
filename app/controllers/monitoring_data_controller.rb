class MonitoringDataController < UserBaseController

  ALLOWED_INFLUX_MEASURES = [
    'events', 'temperature', 'pressure', 'humidity', 'blockTemp', 'sampleTemp', 'lidTemp', 'angularSpeed', 'co2'
  ]

  QUERY_LIMIT = 10_000

  def sensor_data
    data_name      = params.require(:data_name)
    instruction_id = params.require(:instruction_id)
    grouping       = params[:grouping]
    start_time_ms  = params[:start_time]
    end_time_ms    = params[:end_time]

    is_event_query = data_name == 'events'

    if !(start_time_ms && end_time_ms)
      span = time_span_for_instruction(instruction_id)
      if !span
        return render json: { error: "Instruction #{instruction_id} does not have valid start and end warps." }
      end
      start_time_ms, end_time_ms = span
    end

    instruction = Instruction.find(instruction_id)
    authorize(instruction, :show?)

    if grouping and is_event_query
      return render json: { error: "Grouping does not apply to \'events\'." }, status: :bad_request
    end
    if grouping and !/^\d+ms$/.match(grouping)
      return render json: { error: "Invalid grouping string." }, status: :bad_request
    end

    if not ALLOWED_INFLUX_MEASURES.include? data_name
      return render json: { error: "Invalid data name #{data_name}." }, status: :bad_request
    end

    device_ids = instruction.warps.map(&:device_id).uniq
    return [] if device_ids.nil?

    start_time = Time.at(start_time_ms.to_i / 1000)
    end_time   = Time.at(end_time_ms.to_i / 1000)

    query = generate_influx_query(data_name, start_time, end_time, device_ids, grouping, QUERY_LIMIT)
    values = execute_influx_query(query)

    # events are parsed differently from series data
    results = is_event_query ? parse_influx_events(values) : parse_influx_series(values, grouping)

    render json: results
  end

  #
  # HELPER METHODS
  #

  def device_data_for_warps(warp_ids, data_name, grouping)
    warps      = Warp.where(id: warp_ids)
    start_time = warps.minimum(:reported_started_at)
    end_time   = warps.maximum(:reported_completed_at)
    device_ids = warps.map(&:device_id).uniq

    # require a valid time range and valid devices
    return [] if start_time.nil? or end_time.nil? or device_ids.nil?

    query = generate_influx_query(data_name, start_time, end_time, device_ids, grouping, QUERY_LIMIT)
    execute_influx_query(query)
  end

  def execute_influx_query(query)
    begin
      results = INFLUXDB.query(query)
      values = results.flat_map { |x| x['values'] }
    rescue InfluxDB::Error => e
      Rails.logger.error "Unable to query influxdb for monitoring data: #{e}"
      bugsnag_data = {
        incident_id: "ex1#{SNOWFLAKE.next.to_base31}",
        severity: 'error'
      }
      Bugsnag.notify(e, bugsnag_data) if Rails.env.production?
      values = []
    end
    values
  end

  def parse_influx_series(values, grouping)
    # Parses continuous series data from influx
    selected_values = grouping ? values.select { |v| v['mean'] } : values

    value_field = grouping ? 'mean' : 'value'

    results = selected_values.map do |v|
      { time: v['time'], value: v[value_field].round(4) }
    end

    { results: results }
  end

  def parse_influx_events(values)
    # Parses discrete event data from influx
    events = values.flat_map { |x| JSON.parse(x['event'].delete('\\')) }

    { results: events }
  end

  def generate_influx_query(data_name, start_time, end_time, device_ids, grouping, limit = QUERY_LIMIT)
    start_str   = start_time.iso8601
    end_str     = end_time.iso8601
    time_clause = "time >= #{influx_string(start_str)} AND time <= #{influx_string(end_str)}"

    devices_clause = device_ids.map { |id|
      "deviceId = #{influx_string(id)}"
    }.join(" OR ")

    all_clauses = [ devices_clause, time_clause ].reject(&:empty?).join(" AND ")

    values = if data_name == "events"
               "event"
             elsif grouping
               "mean(value)"
             else
               "value"
             end

    # Construct query string
    q = [ "SELECT #{values} FROM #{influx_series(data_name)}" ]
    q.append("WHERE #{all_clauses}")
    if grouping
      q.append("GROUP BY time(#{grouping})")
    end
    q.append("LIMIT #{limit}")

    q.join(' ')
  end

  private

  def influx_string(str)
    "'#{str.gsub(/\\/, '\\\\').gsub(/'/, '\\\'')}'"
  end

  def influx_series(str)
    "\"#{str.gsub(/\\/, '\\\\').gsub(/"/, '\\"')}\""
  end

  def time_span_for_instruction(id)
    warps = Warp.where(instruction_id: id)
                .where.not(reported_started_at: nil, reported_completed_at: nil)
                .order('reported_started_at')

    if warps.count == 0
      return nil
    end

    [
      warps.first.reported_started_at,
      warps.last.reported_completed_at
    ].map { |time| time.to_f * 1000 }
  end

end
