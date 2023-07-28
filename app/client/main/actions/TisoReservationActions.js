/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import ajax                from 'main/util/ajax';
import TisoReservationAPI from 'main/api/TisoReservationAPI';

const TisoReservationActions = {

  search(searchOptions) {
    return TisoReservationAPI.indexAll({
      filters: searchOptions,
      includes: ['device']
    });
  },

  loadAll() {
    return ajax.get('/api/tiso_reservations/occupants')
      .done((data) => {
        Dispatcher.dispatch({
          type: 'TISO_RESERVATION_LIST',
          reservations: data.reservations
        });
      });
  },

  submitManual(container_id) {
    return ajax.post('/api/tiso_reservations/manual_remove', { id: container_id });
  },

  submitRetrieve(container_id) {
    return ajax.post('/api/tiso_reservations/retrieve', { container_id });
  },

  submitDiscard(container_id) {
    return ajax.post('/api/tiso_reservations/discard', { container_id });
  },

  submitManualMany(containerIdList) {
    return ajax.post('/api/tiso_reservations/manual_remove_many', { data: { attributes: {  container_ids: containerIdList } } });
  },

  submitRetrieveMany(containerIdList) {
    return ajax.post('/api/tiso_reservations/retrieve_many',  { data: { attributes: {  container_ids: containerIdList } } });
  },

  submitDiscardMany(containerIdList) {
    return ajax.post('/api/tiso_reservations/discard_many',  { data: { attributes: {  container_ids: containerIdList } } });
  }
};

export default TisoReservationActions;
