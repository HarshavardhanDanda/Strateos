import API from './API';

class TisoReservationAPI extends API {
  constructor() {
    super('tiso_reservations');
  }
}

export default new TisoReservationAPI();
