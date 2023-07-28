import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import API from './API';

export class VendorAPI extends API {
  constructor() {
    super('vendors');
  }

  getCommercialVendors() {
    return ajax.get(Urls.commercial_vendors());
  }
}

export default new VendorAPI();
