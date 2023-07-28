class RunExecutionVideoJob
  include Sidekiq::Worker
  NUM_RETRIES = 3
  sidekiq_options :retry => NUM_RETRIES

  BUCKET = ENV["RUN_EXECUTION_VIDEO_S3_BUCKET"]
  LOG_PREFIX = "[RunExecutionVideoJob]"

  # We want to capture the video from the 'birds eye' camera.
  # This assumes that whoever is administrating the nest cams is aware
  # that they need to name at least one camera 'birds eye'.
  CAMERA_TITLE = /birds eye/i

  sidekiq_retries_exhausted do |msg|
    err_message = "Failed to execute run execution video job, after #{NUM_RETRIES} retries. " \
                  "#{msg['class']} with #{msg['args']}: #{msg['error_message']}"
    raise RunExecutionVideoError.new(err_message)
  end

  def perform(run_execution_id)
    if !BUCKET
      Rails.logger.warn("#{LOG_PREFIX} Please set 'RUN_EXECUTION_VIDEO_S3_BUCKET' to create videos")
      return
    end

    run_execution = RunExecution.find(run_execution_id)

    if run_execution.started_at.nil? || run_execution.completed_at.nil?
      Rails.logger.warn("#{LOG_PREFIX} Run execution #{run_execution_id} "\
                        "does not have a started_at and ended_at time")
      return
    end

    if run_execution.completed_at < run_execution.started_at
      raise RunExecutionVideoError.new("#{LOG_PREFIX} RunExecution completed_at is earlier than it's started_at")
    end

    workcell = run_execution.workcell_id
    workcell_prefix = workcell.split('-')[0]
    cameras = VideoClipService.cameras[workcell_prefix]
    if cameras.nil? || cameras.empty?
      Rails.logger.info("#{LOG_PREFIX} Could not find cameras for workcell #{workcell}")
      return
    end

    camera = cameras.find { |c| c[:title].match(CAMERA_TITLE) }

    if camera.nil?
      Rails.logger.info("#{LOG_PREFIX} Unable to find camera for workcell #{workcell}")
      return
    end

    clip_data = VideoClipService.render_video_clip(
      camera[:id],
      run_execution.started_at.to_f,
      run_execution.completed_at.to_f,
      run_execution.tcle_id
    )

    if clip_data.nil?
      error_msg = "Unable to create clip for #{run_execution.tcle_id}."
      raise RunExecutionVideoError.new(error_msg)
    end

    begin
      retry_count ||= 0
      sleep 10
      download = open(clip_data["download_url"])
    rescue OpenURI::HTTPError
      retry_count += 1
      if retry_count < 3
        delay = (clip_data['length_in_seconds'] * 1.5).ceil
        sleep delay * (2**retry_count)
        Rails.logger.info("#{LOG_PREFIX} Failed to retrieve video. "\
                          "Retrying ##{retry_count} for #{run_execution.tcle_id}.")
        retry
      else
        raise
      end
    end

    ext = File.extname(clip_data["download_url"])
    S3Helper.instance.client.put_object(
      bucket: BUCKET,
      key: "#{run_execution.tcle_id}#{ext}",
      content_type: "video/mp4",
      body: download
    )

    clip_data["download_url"]

  ensure
    # delete video clip
    VideoClipService.delete_video_clip(clip_data["id"]) if clip_data
  end
end
