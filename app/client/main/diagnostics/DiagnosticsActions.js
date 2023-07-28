import Moment from 'moment';

import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';

// Actions for dispatching diagnostics related data
const DiagnosticsActions = {

  // param `grouping` is the time resolution we will use to query the db, e.g. '100ms'
  getSensorData({ data_name, start_time, end_time, grouping, instructionId }) {
    const url = Urls.sensor_data(data_name);
    const options = {
      start_time,
      end_time,
      instruction_id: instructionId
    };
    if (grouping) {
      options.grouping = grouping;
    }

    return ajax.get(url, options).done((data) => {
      const sensorData = data.results.map(({ time, value }) => ({
        instructionId,
        time: +Moment(time),
        value
      }));
      return Dispatcher.dispatch({
        type: 'SENSOR_DATA',
        sensorType: data_name,
        grouping: `${grouping}`,
        sensorData
      });
    }).fail((...response) => NotificationActions.handleError(...response));
  }
};

export default DiagnosticsActions;
