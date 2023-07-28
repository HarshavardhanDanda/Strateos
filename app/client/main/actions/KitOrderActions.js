/* eslint-disable camelcase */
import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import Urls from 'main/util/urls';

const KitOrderActions = {
  urlBase: '/api/kit_orders',

  load(id, options) {
    const data = options && options.data;
    return HTTPUtil.get(`${this.urlBase}/${id}`, { data, options })
      .done((order) => {
        JsonAPIIngestor.ingest(order);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadCurrent(options) {
    return HTTPUtil.get(`${this.urlBase}/current`, { options })
      .done((orders) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_LIST', orders });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadAll(options) {
    return HTTPUtil.get(this.urlBase, { options })
      .done((orders) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_LIST', orders });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroy(id) {
    return ajax.delete(`${this.urlBase}/${id}`)
      .done(() => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_DELETE', id });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroyMany(ids) {
    return ajax.post(`${this.urlBase}/destroy_many`, { order_ids: ids })
      .done(() => {
        Dispatcher.dispatch({ type: 'KIT_ORDERS_DELETE', ids });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  create(kitId, count, lab_id) {
    return ajax.post(this.urlBase, { kit_id: kitId, count, lab_id })
      .done((order) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_DATA', order });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  checkin(id) {
    return ajax.post(`/api/kit_orders/${id}/checkin`)
      .done((data) => {
        Dispatcher.dispatch({
          type: 'KIT_ORDER_CHECKIN',
          order: data.kit_order
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  bulkCheckin(orders) {
    return ajax.post(`${this.urlBase}/bulk_checkin`, { kit_orders: orders })
      .done((orders) => {
        Dispatcher.dispatch({
          type: 'KIT_ORDER_LIST',
          orders
        });
      })
      .fail((...response) => {
        if (Array.isArray(response[0].responseJSON)) {
          const responseJSON = response[0].responseJSON;
          let errorText;
          responseJSON && responseJSON.forEach((resp) => {
            const errors = resp.errors;

            errors.forEach((error, idx) => {
              const rowIdx = Object.keys(error)[0];
              const error_keys = Object.keys(error[rowIdx]);
              error_keys.forEach((error_key) => {
                if (error[rowIdx]) {
                  errorText = error[rowIdx];
                } else {
                  errorText = error[idx][error_key][0];
                }
              });
            });
          });
          NotificationActions.createNotification({ text: errorText, isError: true });
        } else {
          NotificationActions.handleError(...response);
        }
      });
  },

  materialCheckin(order) {
    return ajax.post(Urls.material_checkin(), { kit_order: order })
      .fail((...response) => {
        if (Array.isArray(response[0].responseJSON)) {
          const responseJSON = response[0].responseJSON;
          let errorText;
          responseJSON && responseJSON.forEach((resp) => {
            const errors = resp.errors;

            errors.forEach((error, idx) => {
              const rowIdx = Object.keys(error)[0];
              const error_keys = Object.keys(error[rowIdx]);
              error_keys.forEach((error_key) => {
                if (error[rowIdx]) {
                  errorText = error[rowIdx];
                } else {
                  errorText = error[idx][error_key][0];
                }
              });
            });
          });
          NotificationActions.createNotification({ text: errorText, isError: true });
        } else {
          NotificationActions.handleError(...response);
        }
      });
  },

  update(id, data) {
    return ajax.put(`${this.urlBase}/${id}`, { kit_order: data })
      .done((order) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_DATA', order });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default KitOrderActions;
