import API from './API';

class LocationTypeAPI extends API {
  constructor() {
    super('location_types');
  }
}

export default new LocationTypeAPI();
