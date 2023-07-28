import _ from 'lodash';
import Immutable from 'immutable';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const DiagnosticsStore = _.extend({}, CRUDStore('diagnostics'), {
  act(action) {
    switch (action.type) {
      case 'SENSOR_DATA':
        this.receiveSensorData(action);
        break;
      default:
    }
  },

  createId(sensorType, grouping) {
    return `${sensorType}||${grouping}`;
  },

  receiveSensorData({ sensorType, sensorData, grouping }) {
    const existingData = this.getDataForGrouping(sensorType, grouping);
    const newData = Immutable.fromJS(sensorData).toSet();
    let mergedData = existingData.toSet().union(newData).toList();
    mergedData = mergedData.sortBy(point => point.get('time')).toJS();

    const key = this.createId(sensorType, grouping);
    const update = {
      id: key,
      data: mergedData
    };
    return this._receiveData([update]);
  },

  getDataForGrouping(sensorType, grouping) {
    const key = this.createId(sensorType, grouping);
    return this.getById(key, Immutable.Map()).get('data', Immutable.List());
  },

  filterByEpochs({ grouping, sensorType, epochRange, instructionId }) {
    const key = this.createId(sensorType, grouping);
    return this.getById(key, Immutable.Map())
      .get('data', Immutable.List())
      .filter((data) => {
        const time = data.get('time');
        return (
          instructionId === data.get('instructionId') &&
          time <= epochRange[1] &&
          time >= epochRange[0]
        );
      });
  },

  // Given an epoch range of time, calculate the level of resolution
  // that we would want to group the time series data by.  For example,
  // If we are looking at 20hrs of data, the calculated resolution may be "10m"
  calculateResolutionFromEpochs(epochRange) {
    const oneMonth = 1000 * 60 * 60 * 24 * 30;
    const diff = epochRange[1] - epochRange[0];
    const numDesiredPoints = 1000;
    let targetGrouping = diff / numDesiredPoints;

    if (targetGrouping > oneMonth) {
      targetGrouping = oneMonth;
    } else if (targetGrouping < 1000) {
      return undefined;
    }

    const multipliers = [1, 2.5, 5, 7.5, 10];
    const pow = Math.floor(Math.log10(targetGrouping));
    const groupings = multipliers.map(m => 10 ** pow * m);
    const grouping = _.find(groupings, g => g >= targetGrouping);

    return `${grouping}ms`;
  }
});

DiagnosticsStore._register(Dispatcher);

export default DiagnosticsStore;
