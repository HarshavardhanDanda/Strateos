import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import VideoLink       from 'main/components/VideoLinks/VideoLink';
import NestCameraStore from 'main/stores/NestCameraStore';
import { DateTime }     from '@transcriptic/amino';

import './VideoLinks.scss';

class VideoLinks extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      cameras: undefined,
      nestCamLoader: undefined
    };
  }

  componentDidMount() {
    NestCameraStore.getAll().done((cameraData) => {
      this.setState({
        cameras: cameraData
      });
    });
  }

  isWithinTimeHorizon(maxWarpStop) {
    const horizon = Moment().subtract(NestCameraStore.HistoryDuration);
    return Moment(maxWarpStop).isAfter(horizon);
  }

  render() {
    const { instruction } = this.props;
    const warpStartTimes = [];
    const warpCompletionTimes = [];

    instruction.warps.forEach((warp) => {
      warpStartTimes.push(Moment(warp.reported_started_at).valueOf());
      warpCompletionTimes.push(Moment(warp.reported_completed_at).valueOf());
    });

    const minWarpStart = _.min(warpStartTimes);
    const maxWarpStop = _.max(warpCompletionTimes);

    if (minWarpStart == undefined || maxWarpStop == undefined) {
      return false;
    }

    const withinTimeHorizon = this.isWithinTimeHorizon(maxWarpStop);

    let workCellID;
    const warp = instruction.warps[0];

    if (warp && warp.device_id) {
      workCellID = warp.device_id.split('-')[0];
    }

    // TODO Dont render Param here.  Leave that up to instructions.jsx.
    return (
      <div>
        <Choose>
          <When condition={this.state.cameras === undefined}>Loading...</When>
          <When condition={_.isEmpty(this.state.cameras)}>
            Error loading cameras
          </When>
          <Otherwise>
            <div className="video-links-container">
              <Choose>
                <When condition={withinTimeHorizon}>
                  <div>
                    <ul className="video-links">
                      {(this.state.cameras[workCellID] || []).map((camera) => {
                        return (
                          <li key={camera.id} className="video-links__link">
                            <VideoLink
                              key={camera.id}
                              start={minWarpStart}
                              stop={maxWarpStop}
                              id={camera.id}
                              name={camera.title}
                              title={`${workCellID}-${instruction.operation
                                .op}-${instruction.id}`}
                            />
                          </li>
                        );
                      })}
                    </ul>
                    <p className="video-duration">
                      <span>Duration: </span>
                      <DateTime
                        format="human-duration"
                        timestamp={maxWarpStop - minWarpStart}
                      />
                    </p>
                  </div>
                </When>
                <Otherwise>
                  <span>Video unavailable (too old)</span>
                </Otherwise>
              </Choose>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

VideoLinks.displayName = 'VideoLinks';

VideoLinks.propTypes = {
  instruction: PropTypes.object.isRequired
};

export default VideoLinks;
