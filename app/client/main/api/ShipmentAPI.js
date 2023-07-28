import API from 'main/api/API';
import ajax from 'main/util/ajax';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import JsonAPIIngestor from './JsonAPIIngestor';

class ShipmentsAPI extends API {
  constructor() {
    super('shipments');
  }

  loadImplementation() {
    const labIds = FeatureStore.getLabIdsWithFeatures(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS);
    const options = {
      filter: {
        shipment_type: 'implementation',
        lab_id: labIds.toJS()
      },
      limit: 5000
    };
    const url = this.createUrl('', options);

    return ajax.get(url, options)
      .done(payload => {
        JsonAPIIngestor.ingest(payload);
      });
  }
}

export default new ShipmentsAPI();
