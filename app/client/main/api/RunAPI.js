import _ from 'lodash';
import API from 'main/api/API';
import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import ContextualCustomProperties from './ContextualCustomProperties';

class RunAPI extends API {
  constructor() {
    super('runs');
  }

  search(options) {
    const url = this.createUrl('/search');
    const response = ajax.post(url, options);

    response.done(({ results, num_pages, per_page }) => {
      const dispatchData = _.extend(
        { type: 'RUNS_SEARCH_RESULTS' }, options, { results, num_pages, per_page }
      );

      Dispatcher.dispatch(dispatchData);
    });

    return response;
  }

  updateCustomProperty(runId, key, value, options = {}) {
    ContextualCustomProperties.updateCustomProperty(this, runId, key, value, options);
  }
}

export default new RunAPI();
