import _ from 'lodash';
import Dispatcher          from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import ajax                from 'main/util/ajax';
import Urls                from 'main/util/urls';

const defaultErrorHandler = _.bind(NotificationActions.handleError, NotificationActions);

const ReturnShipmentActions = {
  loadAll() {
    return ajax.get(Urls.return_shipments_api())
      .done(returnShipments => Dispatcher.dispatch({ type: 'RETURN_SHIPMENT_LIST', returnShipments }));
  },

  create({ containerIds, addressId, speed, temp, isCourierPickup, carrier }) {
    return ajax.post(Urls.return_shipments_api(), {
      container_ids: containerIds,
      address_id: addressId,
      speed,
      temp,
      is_courier_pickup: isCourierPickup,
      carrier
    })
      .done(returnShipment =>
        Dispatcher.dispatch({
          type: 'RETURN_SHIPMENT_DATA', returnShipment
        }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update({ id, containerIds, addressId, speed, temp, isCourierPickup, carrier }) {
    return ajax.put(Urls.return_shipment(id), {
      container_ids: containerIds,
      address_id: addressId,
      speed,
      temp,
      is_courier_pickup: isCourierPickup,
      carrier
    })
      .done(returnShipment =>
        Dispatcher.dispatch({
          type: 'RETURN_SHIPMENT_DATA', returnShipment
        }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  authorize({ id, paymentMethodId }) {
    return ajax.post(Urls.return_shipment_authorize(id), { payment_method_id: paymentMethodId })
      .done((returnShipment) => {
        Dispatcher.dispatch({
          type: 'RETURN_SHIPMENT_DATA', returnShipment
        });
        Dispatcher.dispatch({
          type: 'CONTAINER_LIST',
          containers: returnShipment.containers
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroy_abandoned(id) {
    Dispatcher.dispatch({
      type: 'RETURN_SHIPMENT_DELETED',
      id
    });
    // client doesn't need to know about cleanup
    return ajax.post(Urls.return_shipment_destroy_abandoned(id));
  },

  shipabilityInfo(containerIds) {
    return ajax.post(Urls.return_shipments_shipability_info(), {
      container_ids: containerIds
    })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadPending(options) {
    return ajax.get('/api/return_shipments/pending', { options })
      .done(returnShipments => Dispatcher.dispatch({ type: 'RETURN_SHIPMENT_LIST', returnShipments }));
  },

  purchase(id) {
    return ajax.post(`/api/return_shipments/${id}/purchase`)
      .done((returnShipment) => {
        Dispatcher.dispatch({ type: 'RETURN_SHIPMENT_DATA', returnShipment });
      })
      .fail(defaultErrorHandler);
  },

  cancel(id) {
    return ajax.post(`/api/return_shipments/${id}/cancel`)
      .done(() => {
        Dispatcher.dispatch({ type: 'RETURN_SHIPMENT_DELETED', id });
      })
      .fail(defaultErrorHandler);
  },

  ship(id) {
    return ajax.post(`/api/return_shipments/${id}/ship`)
      .done((returnShipment) => {
        Dispatcher.dispatch({ type: 'RETURN_SHIPMENT_DATA', returnShipment });
      })
      .fail(defaultErrorHandler);
  }

};

export default ReturnShipmentActions;
