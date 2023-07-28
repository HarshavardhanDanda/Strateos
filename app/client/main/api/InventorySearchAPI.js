import ajax from 'main/util/ajax';
import API from 'main/api/API';

import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

class InventorySearchAPI extends API {
  constructor() {
    super('inventory_searches');
  }

  create(attributes) {
    const response = ajax.post(this.createUrl(''), {
      data: {
        type: 'inventory_searches',
        attributes: attributes
      }
    });

    // TODO: This code is duplicated in API.js
    response.done((payload) => {
      const groupedEntities = JsonAPIIngestor.ingest(payload);
      // get normalized entities for the resource itself, not included entities.
      const entities = groupedEntities.containers || [];
      const query    = attributes.query;
      const page     = attributes.page;
      const perPage  = attributes.per_page;
      const numPages = Math.ceil(payload.meta.record_count / perPage);

      JsonAPIIngestor.ingestPagination(entities, query, 'container', page, perPage, numPages);
    });

    return response;
  }
}

/* eslint-disable import/prefer-default-export */
export default new InventorySearchAPI();
