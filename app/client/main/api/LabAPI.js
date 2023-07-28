import ajax from 'main/util/ajax';
import FeatureStore from 'main/stores/FeatureStore.js';
import NotificationActions from 'main/actions/NotificationActions';
import API from './API';

class LabAPI extends API {
  constructor() {
    super('labs');
  }

  loadAllLabWithFeature(feature) {
    const labIds = FeatureStore.getLabIdsWithFeatures(feature).toJS();
    const options = {
      filter: {
        id: labIds
      }
    };
    const url = this.createUrl('', options);

    return ajax.get(url, options)
      .done().fail((...response) => NotificationActions.handleError(...response));
  }
}

export default new LabAPI();
