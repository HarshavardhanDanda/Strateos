import NotificationActions from 'main/actions/NotificationActions';
import RunScheduleAPI      from 'main/api/RunScheduleAPI';

const RunScheduleActions = {

  loadRunSchedules(options = {}) {
    return RunScheduleAPI.indexAll({
      filters: options })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  loadAllRunschedules(runId) {
    return RunScheduleAPI.indexAll({
      filters: {
        run_id: runId
      } })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  }
};

export default RunScheduleActions;
