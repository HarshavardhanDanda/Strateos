/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const WarpEventActions = {
  warpEventErrorsForRun(project_id, run_id, options) {
    return HTTPUtil.get(Urls.run_warp_event_errors(project_id, run_id), { options })
      .done((warpEventErrors) => {
        Dispatcher.dispatch({ type: 'WARP_EVENT_ERROR_LIST', warpEventErrors });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default WarpEventActions;
