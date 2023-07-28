class DeviceMaintenanceQCJob
  include Sidekiq::Worker

  CUSTOM_PROTOCOL_INPUTS = {
    "bravo" => {
      "wc4-bravo1" => { "shape_format" => "SBS96", "tip_type" => "bravofiltered180" },
      "wc5-bravo1" => { "shape_format" => "SBS96", "tip_type" => "bravofiltered180" },
      "wc5-bravo2" => { "shape_format" => "SBS384", "tip_type" => "bravo384std30" },
      "wc6-bravo1" => { "shape_format" => "SBS96", "tip_type" => "bravofiltered180" }
    }
  }

  DEVICE_SCHEDULE = {
    "infinite"  => { qcstart: Time.new(2015, 12, 8),  interval_days: 60, manual: true },
    "qpcr"      => { qcstart: Time.new(2015, 11, 29), interval_days: 90, manual: true },
    "multidrop" => { qcstart: Time.new(2016, 11, 25),  interval_days: 30 },
    "omni"      => { qcstart: Time.new(2016, 11, 25),  interval_days: 30 },
    "echo"      => { qcstart: Time.new(2016, 11, 15), interval_days: 30 },
    "bravo"     => { qcstart: Time.new(2016, 11, 5), interval_days: 30, custom: true }
  }

  def manual_qc_url(device_class)
    # If QC is not launchable through webapp, include link to how to run QC here
    paths = {
      "infinite" => "https://strateos.atlassian.net/wiki/spaces/SCIENCE/pages/283935136/Tecan+Infinite+M200+Pro+QC",
      "pcr"      => "https://strateos.atlassian.net/wiki/spaces/SCIENCE/pages/1434485555/qPCR-Machines-Biorad-CFX384-and-CFX96"
    }

    path = paths[device_class]

    if path.nil?
      "https://strateos.atlassian.net/wiki/spaces/SCIENCE/overview#Maintenance-and-QC-Procedures"
    else
      path.to_s
    end
  end

  def determine_device_class
    active_device_class = []
    DEVICE_SCHEDULE.each do |device_class, device_param|
      diff = ((device_param[:qcstart] - Time.now) / 1.day).ceil
      active_device_class.push(device_class) if (diff % device_param[:interval_days]) == 0
    end
    Sidekiq.logger.info("[DeviceMaintenanceQCJob] determine_device_class
      Devices to schedule: #{active_device_class.length} #{active_device_class.inspect}"
    )
    active_device_class
  end

  def determine_run_title(device_name)
    "#{device_name}_qc_#{Time.now.strftime('%y-%m-%d')}"
  end

  def execute_protocol_from_s3(protocol, inputs)
    Sidekiq.logger.info("[DeviceMaintenanceQCJob] execute_protocol_from_s3
      #{protocol.command_string}
      #{protocol.release.bucket}
      #{protocol.release.binary_attachment_url}
      #{inputs}
      "
    )
    begin
      igor_resp = IgorService.execute_protocol_from_s3(
        protocol.command_string,
        protocol.release.bucket,
        protocol.release.binary_attachment_url,
        inputs
      )
      Sidekiq.logger.info("[DeviceMaintenanceQCJob] IgorService
        response success:#{igor_resp[:success]}"
      )
      igor_resp[:autoprotocol]
    rescue StandardError => e
      Bugsnag.notify("[DeviceMaintenanceQCJob] IgorService error while creating Autoprotocol "\
                     "for Device QC: #{e.inspect}")
    end
  end

  def get_latest_protocol_release(device_class)
    protocol = Protocol.where(name: "#{device_class}QC", package_name: "com.transcriptic.qc",
published: true).max_by(&:version)
    Sidekiq.logger.info("[DeviceMaintenanceQCJob] get_latest_protocol_release
      Protocol #{protocol.name}:#{protocol.id}
        - Release #{protocol.release_id}:v#{protocol.version}
        - Published #{protocol.published}"
    )
    protocol
  end

  def launch_qc_run(device_class, device_name)
    Sidekiq.logger.info("[DeviceMaintenanceQCJob] launch_qc_run
      Launching QC Run for: #{device_class} - #{device_name}"
    )

    protocol = get_latest_protocol_release(device_class)

    autoprotocol = if DEVICE_SCHEDULE[device_class][:custom]
      execute_protocol_from_s3(
        protocol, { refs: {}, parameters: CUSTOM_PROTOCOL_INPUTS[device_class][device_name] }
      )
    else
      protocol.preview
    end

    run              = Run.new
    run.project_id   = "p18qj7p6crwx3"
    run.owner        = User.find_by_email("internal-tools@transcriptic.com")
    run.title        = determine_run_title(device_name)
    run.bsl          = 1
    run.lab          = Lab.find_by_name("Menlo Park")
    run.request_type = 'protocol'
    run.protocol_id  = protocol.id
    run.protocol     = autoprotocol
    run.internal_run = true
    if run.errors.present?
      raise StandardError, run.errors.messages
    end
    run.save
    Sidekiq.logger.info("[DeviceMaintenanceQCJob] Run created
      #{run.title}:#{run.id} in Project #{run.project_id}"
    )

    run_url = Rails.application.routes.url_helpers.admin_run_path(run.id)

    [ run.title, run_url ]
  end

  def perform
    active_device_class = determine_device_class

    return if active_device_class.empty?

    begin
      active_device_class.each do |device_class|
        Device.where(device_class: device_class).each do |device|
          if DEVICE_SCHEDULE[device_class][:manual]
            run_title = determine_run_title(device.id)
            url       = manual_qc_url(device_class)
          else
            run_title, url = launch_qc_run(device_class, device.id)
            url = "http://secure.transcriptic.com#{url}"
          end
          Sidekiq.logger.info("[DeviceMaintenanceQCJob] perform
            QC Run Details to Slack: '#{run_title}' - #{url}"
          )
          SlackMessageForQCRunJob.perform_async(run_title, url)
          rescue StandardError => e
            Bugsnag.notify("[DeviceMaintenanceQCJob] error while creating Device QC Run: #{e.inspect}")
        end
      end
    rescue StandardError => e
      Bugsnag.notify("[DeviceMaintenanceQCJob] error while creating Device QC Run: #{e.inspect}")
    end
  end
end
