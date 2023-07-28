import { map }   from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import { humanizeDuration } from 'main/util/TimeUtil';

class Timing extends React.Component {
  timings() {
    const insts = this.props.run.get('instructions');
    const warps = insts.flatMap(i => i.get('warps'));
    const totals = {};

    warps.forEach((warp) => {
      if (warp.get('completed_at') != undefined) {
        const deviceId = warp.get('device_id');
        if (totals[deviceId] == undefined) {
          totals[deviceId] = 0;
        }

        totals[deviceId] += Moment(warp.get('completed_at')) - Moment(warp.get('created_at'));
        return totals[deviceId];
      } else {
        return undefined;
      }
    });

    return totals;
  }

  render() {
    const ts = this.timings();

    return (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Device</th>
            <th>Total time</th>
          </tr>
        </thead>

        <tbody>
          <Choose>
            <When condition={Object.keys(ts).length > 0}>
              { map(ts, (totalTimeMs, deviceId) => {
                return (
                  <tr key={deviceId}>
                    <td>{deviceId}</td>
                    <td>{humanizeDuration(totalTimeMs)}</td>
                  </tr>
                );
              })}
            </When>
            <Otherwise>
              <tr>
                <td>
                  <p className="caption tx-type--heavy tx-type--secondary">
                    (Timing data will be available after the run is complete)
                  </p>
                </td>
              </tr>
            </Otherwise>
          </Choose>
        </tbody>
      </table>
    );
  }
}

Timing.propTypes = {
  run: PropTypes.object
};

export default Timing;
