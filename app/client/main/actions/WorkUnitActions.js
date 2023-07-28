import NotificationActions from 'main/actions/NotificationActions';
import SessionStore from 'main/stores/SessionStore';
import Dispatcher  from 'main/dispatcher';
import WorkUnitAPI from '../api/WorkUnitAPI';

const WorkUnitActions = {
  loadAllWorkUnits() {
    return WorkUnitAPI.indexAll({
      filters: {
        organization_id: SessionStore.getOrg().get('id')
      } })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },
  loadWorkUnitsByLabId(lab_id) {
    return WorkUnitAPI.indexAll({
      filters: {
        lab_id: lab_id
      } })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },
  empty() {
    Dispatcher.dispatch({
      type: 'WORKCELLS_EMPTY'
    });
  }
};

export default WorkUnitActions;
