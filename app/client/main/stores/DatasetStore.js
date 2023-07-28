/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';
import Immutable from 'immutable';

import CRUDStore           from 'main/util/CRUDStore';
import Dispatcher          from 'main/dispatcher';
import ContainerTypeHelper from 'main/helpers/ContainerType';

const DatasetStore = _.extend({}, CRUDStore('datasets'), {
  act(action) {
    switch (action.type) {
      case 'DATASET_LIST':
        return this._receiveData(action.datasets);

      case 'DATASET_DATA':
        return this._receiveData([action.dataset]);

      case 'DATASETS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  withContainerHelpers(dataset) {
    if (!dataset) { return; }

    const rawType = dataset.getIn(['container', 'container_type']);
    if (!rawType) { return dataset; }

    const container_type = Immutable.fromJS(
      new ContainerTypeHelper(rawType.toJS())
    );

    return dataset.set('container_type', container_type);
  }
});

DatasetStore._register(Dispatcher);

export default DatasetStore;
