/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import Moment from 'moment';
import ajax   from 'main/util/ajax';
import Urls   from 'main/util/urls';

/*
 * Not your typical store. This store manages and fetches the data, exposing
 * a promise interface for all operations.
 */
const NestCameraStore = {
  // 10 days of history. We won't show the video link if older than this. We can upgrade
  // to 30 days if we want
  HistoryDuration: Moment.duration(10, 'days'),

  getAll() {
    this.camDataLoader = this.camDataLoader || ajax.get(Urls.video_clip_cameras()).promise();
    return this.camDataLoader;
  }
};

export default NestCameraStore;
