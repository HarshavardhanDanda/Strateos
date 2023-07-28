class VideosController < UserBaseController
  before_action :authenticate_admin!

  def cameras
    render json: VideoClipService.cameras
  end

  def show
    clip_data = VideoClipService.get_clip(params.require(:id))
    if clip_data.nil?
      render json: { error_message: "Unable to fetch clip. Please try again in a moment" }, status: :service_unavailable
      return
    end
    render json: clip_data.slice(*keys_to_expose)
  end

  def create_clip
    input = params.permit(:padding, :title, :device_id, :start_time, :stop_time)

    # Padding around the clip, in seconds
    padding = (input[:padding] || 10).to_i

    device_id  = input.require(:device_id)
    start_time = input.require(:start_time).to_f - padding
    stop_time  = input.require(:stop_time).to_f + padding

    clip_data = VideoClipService.render_video_clip(device_id, start_time, stop_time, input[:title])

    if clip_data.nil?
      render json: { error_message: "Unable to create clip. The clip might be too old,"\
                                    " or we may be out of storage capacity" }, status: :conflict
      return
    end

    clip_id = clip_data["id"]

    # Create a sidekiq job to delete this clip in the future
    deletion_delay = [ 2.minutes.to_i, (clip_data['length_in_seconds'] * 1.5).ceil ].max
    VideoClipService.delay_for(deletion_delay).delete_video_clip(clip_id)

    render json: clip_data.slice(*keys_to_expose)
  end

  private

  def keys_to_expose
    [ 'download_url', 'embed_url', 'id', 'is_generated', 'length_in_seconds', 'thumbnail_url' ]
  end

end
