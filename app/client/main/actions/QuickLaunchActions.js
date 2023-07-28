import Dispatcher from 'main/dispatcher';
import HTTPUtil   from 'main/util/HTTPUtil';
import ajax       from 'main/util/ajax';
import Urls       from 'main/util/urls';

const QuickLaunchActions = {
  load(projectId, quickLaunchId, options) {
    return HTTPUtil.get(Urls.quick_launch(projectId, quickLaunchId), { options })
      .done(quickLaunch => Dispatcher.dispatch({ type: 'QUICK_LAUNCH_DATA', quickLaunch }));
  },

  resolveInputs(projectId, quickLaunchId, inputs) {
    return ajax.post(Urls.quick_launch_resolve_inputs(projectId, quickLaunchId), { inputs });
  }
};

export default QuickLaunchActions;
