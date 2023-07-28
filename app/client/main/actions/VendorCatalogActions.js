import _ from 'lodash';

import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const VendorCatalogActions = {
  search(options, httpOptions) {
    const defaults = {
      page: {
        number: 1,
        size: 20
      }
    };

    const data = _.extend(defaults, options);
    const url = Urls.emolecules_flattened();

    return HTTPUtil.get(url, { data, options: httpOptions })
      .done(({ data: results }) => {
        Dispatcher.dispatch({
          type: 'VENDOR_CATALOG_SEARCH_RESULTS',
          results: results.map(({ attributes }) => {
            const id = attributes.smiles + '_' + attributes.supplier.id + '_' + attributes.supplier.sku + '_' + attributes.supplier.price + '_' + attributes.supplier.currency;
            return { id, ...attributes };
          })
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default VendorCatalogActions;
