import API from 'main/api/API';

class ReturnShipmentAPI extends API {
  constructor() {
    super('return_shipments');
  }
}

export default new ReturnShipmentAPI();
