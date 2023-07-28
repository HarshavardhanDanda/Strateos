/* eslint-bisable camelcase */
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import ajax from 'main/util/ajax';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const ImplementationItemActions = {
  create(data, shipmentId) {
    return ajax.post(
      '/api/implementation_items', { data, shipment_id: shipmentId }
    ).done((implementationItem) => {
      Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_DATA', implementationItem });
    }).fail((...args) => NotificationActions.handleError(...args));
  },

  // data should be a plain JS Object
  update(id, data) {
    return ajax.patch(`/api/implementation_items/${id}`, { data: { attributes: {  implementation_item: data } } })
      .done((implementationItem) => {
        JsonAPIIngestor.ingest(implementationItem);
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  destroy(id) {
    return ajax.delete(`/api/implementation_items/${id}`)
      .done(() => {
        Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_DESTROYED', id });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  loadAll(shipmentId) {
    return ajax.get('/api/implementation_items', { shipment_id: shipmentId })
      .done((implementationItems) => {
        Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_LIST', implementationItems: implementationItems.data });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  }
};

export default ImplementationItemActions;
