import API from './API';

class SupplierAPI extends API {
  constructor() {
    super('suppliers');
  }
}

export default new SupplierAPI();
