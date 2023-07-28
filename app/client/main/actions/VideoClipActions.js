import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const VideoClipActions = {
  get(id, options) {
    return HTTPUtil.get(Urls.video_clip(id), { options });
  },

  /*
   * Creates a new video clip
   *
   * Parameters
   *   id: The camera id from which to create the clip
   *   start: The starting timestamp of the clip
   *   stop: The ending timestamp of the clip
   *   title: The title of the clip
   *
   * Returns a promise that is resolved when the clip has been created and is available
   */
  create(id, start, stop, title) {
    const url = Urls.new_video_clip();

    const data = {
      device_id: id,
      start_time: start,
      stop_time: stop,
      title
    };

    const status = ajax.Deferred();

    ajax.post(url, data)
      .done((videoClip) => {
        // Wait until the video clip has been generated
        const checkClipStatus = (clipData) => {
          if (clipData.is_generated) {
            status.resolve(clipData);
          } else {
            setTimeout(() => {
              this.get(clipData.id)
                .done(checkClipStatus)
                .fail(() => checkClipStatus(clipData));
            }, 5000);
          }
        };
        checkClipStatus(videoClip);
      })
      .fail((error) => {
        NotificationActions.handleError(error);
        status.reject(error);
      });

    return status;
  }
};

export default VideoClipActions;
