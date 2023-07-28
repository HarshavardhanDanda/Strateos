import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import API from './API';

class KitOrdersAPI extends API {
  constructor() {
    super('kit_orders');
  }

  getCurrent() {
    return ajax.get(`/api/${this.resourceName}/current`)
      .done((orders) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_LIST', orders });
      });
  }

  update(id, requestData) {
    return ajax.put(`/api/${this.resourceName}/${id}`, requestData)
      .done((order) => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_DATA', order });
      });
  }

  destroy(id) {
    return ajax.delete(`/api/${this.resourceName}/${id}`)
      .done(() => {
        Dispatcher.dispatch({ type: 'KIT_ORDER_DELETE', id });
      });
  }

  checkin(id) {
    return ajax.post(`${this.createUrl('')}/${id}/checkin`)
      .done((data) => {
        Dispatcher.dispatch({
          type: 'KIT_ORDER_CHECKIN',
          order: data.kit_order
        });
      });
  }
}

export default new KitOrdersAPI();
