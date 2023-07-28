import API from 'main/api/API';
import ajax from 'main/util/ajax';
import JsonAPIIngestor from './JsonAPIIngestor';

class ImplementationItemAPI extends API {
  constructor() {
    super('implementation_items');
  }

  selectShipment(shipmentId) {
    const options = {
      filter: {
        shipment_id: shipmentId
      }
    };
    const url = this.createUrl('', options);

    return ajax.get(url, options)
      .done(payload => {
        JsonAPIIngestor.ingest(payload);
      });
  }
}

export default new ImplementationItemAPI();
