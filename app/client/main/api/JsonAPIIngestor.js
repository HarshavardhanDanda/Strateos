import _ from 'lodash';
import Dispatcher from 'main/dispatcher';
import JsonApiDeserializer from './JsonApiDeserializer';

const Deserializer = new JsonApiDeserializer({
  typeAsAttribute: true, // Adds key "type" to entity
});

// Dispatches and normalizes JSON API payloads to all relevant stores.
const JsonAPIIngestor = {
  ingest(payload) {
    const groupedEntities = this.getGroupedEntities(payload);

    // dispatch all entities to their respective stores
    _.each(groupedEntities, (entityGroup, resource) => {
      const type = `${resource.toUpperCase()}_API_LIST`;
      Dispatcher.dispatch({ type, entities: entityGroup });
    });

    return groupedEntities;
  },

  ingestPagination(entities, query, resource, page, perPage, numPages) {
    const type = `${resource.toUpperCase()}_SEARCH_RESULTS`;

    Dispatcher.dispatch({
      type,
      query: query,
      results: entities,
      per_page: perPage,
      num_pages: numPages,
      page: page
    });
  },

  getGroupedEntities(payload) {
    let entities = [];

    if (Array.isArray(payload.data)) {
      // should be an array of entities
      entities = entities.concat(Deserializer.deserialize(payload));
    } else if (payload.data) {
      // should be a single entity
      entities.push(Deserializer.deserialize(payload));
    }

    // add included entities as well
    entities                 = entities.concat(payload.included || []);
    const normalizedEntities = entities.map(JsonAPIIngestor.normalizeEntity);

    return _.groupBy(normalizedEntities, entity => entity.type);
  },

  // Transform jsonapi entity format into a format for our stores.
  // { id: 1, attributes: {} } to { id: 1, field1: 2, ... }
  normalizeEntity(entity) {
    return { id: entity.id, type: entity.type, ...(entity.attributes || entity) };
  }
};

export default JsonAPIIngestor;
