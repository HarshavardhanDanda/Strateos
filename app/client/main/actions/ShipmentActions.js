import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import Immutable from 'immutable';
import NotificationActions from 'main/actions/NotificationActions';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const ShipmentActions = {
  load(id, options) {
    return HTTPUtil.get(Urls.shipment(id), { options })
      .done(shipment => Dispatcher.dispatch({ type: 'SHIPMENT_DATA', shipment }));
  },
  loadAll() {
    return ajax.get(Urls.shipments())
      .done(shipments => Dispatcher.dispatch({ type: 'SHIPMENT_LIST', shipments }));
  },

  loadContainers(id, options) {
    return ajax.get(Urls.shipment_containers(id), { options })
      .done(containers => Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers }));
  },
  checkinContainers(id, containerIds, cb) {
    const data = { data: { attributes: { container_ids: containerIds } } };

    return ajax.post(`/api/shipments/${id}/checkin_containers`, data)
      .done((shipment) => {
        JsonAPIIngestor.ingest(shipment);
        if (cb) {
          cb();
        }
      }).fail((...args) => NotificationActions.handleError(...args));
  },

  destroy(id) {
    return ajax.delete(`/api/shipments/${id}`)
      .done(() => {
        Dispatcher.dispatch({ type: 'SHIPMENT_DESTROYED', id });
      });
  },

  destroyMany(shipmentIds) {
    return ajax.delete('/api/shipments/destroy_many', {
      data: { attributes: { shipment_ids: shipmentIds } } });
  },

  create(data) {
    return ajax.post('/api/shipments', { data })
      .done((shipment) => {
        Dispatcher.dispatch({ type: 'SHIPMENT_DATA', shipment });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  update(id, data) {
    return ajax.patch(`/api/shipments/${id}`, { data })
      .done((shipment) => {
        Dispatcher.dispatch({ type: 'SHIPMENT_DATA', shipment });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },
  checkin(id) {
    return ajax.post(`/api/shipments/${id}/checkin`)
      .done((shipment) => {
        Dispatcher.dispatch({ type: 'SHIPMENT_DATA', shipment });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  partial_checkin(id) {
    return ajax.post(`/api/shipments/${id}/partial_checkin`)
      .done((shipment) => {
        Dispatcher.dispatch({ type: 'SHIPMENT_DATA', shipment });
      });
  },
  createShipmentWithImplementationItems(data) {
    return ajax.post(
      '/api/shipments/create_implementation_items_shipment', { data }
    ).done(payload => JsonAPIIngestor.ingest(payload))
      .fail((...args) => NotificationActions.handleError(...args));
  },

  createShipmentWithCodes(data) {
    return new Promise((resolve) => {
      ajax.post('/api/shipments/create_shipment_with_codes', { data })
        .done((shipment) => {
          const shipmentObject = JsonAPIIngestor.ingest(shipment);
          // fetch containers data to get the updated shipment details
          this.loadContainers(shipment.data.id)
            .done((containers) => {
              const response = Immutable.fromJS({ shipment: shipmentObject.shipments[0], containers: containers });
              resolve(response);
            }).fail((...args) => NotificationActions.handleError(...args));
        }).fail((...args) => NotificationActions.handleError(...args));
    });
  }
};

export default ShipmentActions;
