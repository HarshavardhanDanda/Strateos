/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const RunStore = _.extend({}, CRUDStore('runs'), {
  act(action) {
    switch (action.type) {
      case 'RUN_LIST':
        return this._receiveData(action.runs);

      case 'RUN_DATA':
        return this._receiveData(action.run.data ? [action.run.data] : [action.run]);

      case 'RUN_SUCCESSFULLY_SUBMITTED':
        return this._receiveData([action.data]);

      case 'RUNS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  },

  getByProjectId(projectId) {
    return this.getAll()
      .filter((run) => {
        return run.get('project_id') === projectId ||
          run.getIn(['project', 'id']) === projectId;
      });
  },

  getByContainerId(containerId) {
    return this.getAll()
      .filter(r => (
        r.get('refs') &&
                  r.get('refs').find(ref => ref.get('container_id') === containerId)
      ));
  }
});

RunStore._register(Dispatcher);

export default RunStore;
