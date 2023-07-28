import API from './API';

class DeviceAPI extends API {
  constructor() {
    super('devices');
  }
}

export default new DeviceAPI();
