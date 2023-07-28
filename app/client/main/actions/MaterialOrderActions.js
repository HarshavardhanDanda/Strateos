import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import { getDefaultSearchPerPage } from 'main/util/List';

const MaterialOrderActions = {
  search(options, httpOptions) {
    const defaults = {
      page: {
        page: 1,
        per_page: getDefaultSearchPerPage(),
        q: ''
      }
    };

    const data = _.extend(defaults, options);
    const url = `${Urls.orders()}/search`;
    const query = data.q + (data.c ? data.c : '');

    return HTTPUtil.get(url, { data, options: httpOptions })
      .done(({ results, total_count: totalCount }) => {
        Dispatcher.dispatch({
          type: 'MATERIAL_ORDER_LIST',
          results,
          num_pages: Math.ceil(totalCount / data.per_page),
          per_page: data.per_page,
          page: data.page,
          query
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  bulkCreate(orders) {
    const url = `${Urls.orders()}/bulk_create`;
    return ajax.post(url, orders)
      .done((data) => {
        Dispatcher.dispatch({ type: 'KIT_DATA', kit: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateMany(order_ids, order) {
    const url = `${Urls.orders()}/update_many`;
    const data = {
      order_ids,
      order
    };

    return ajax.put(url, data)
      .done((results) => {
        Dispatcher.dispatch({ type: 'MATERIAL_ORDERS_DATA', results });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default MaterialOrderActions;
