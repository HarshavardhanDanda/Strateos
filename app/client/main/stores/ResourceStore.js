/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';
import { matches } from '@transcriptic/amino';

const ResourceStore = _.extend({}, CRUDStore('resources'), {
  act(action) {
    switch (action.type) {
      case 'RESOURCE_LIST':
        return this.resourcesAdded(action.resources);

      case 'RESOURCE_DATA':
        return this.resourcesAdded([action.resource]);

      case 'RESOURCE_DELETED':
        return this._remove(action.id);

      case 'RESOURCES_API_LIST':
        return this._receiveData(action.entities);

      case 'RESOURCES_SEARCH_RESULTS':
        return this.resourcesAdded(action.results);

      default:
        return undefined;
    }
  },

  validKinds: [
    'Reagent',
    'ChemicalStructure',
    'NucleicAcid',
    'Protein',
    'Cell',
    'Virus'
  ],
  defaultKind: 'Reagent',
  validSensitivities: ['Temperature', 'Light', 'Air', 'Humidity'],

  resourcesAdded(resources) {
    const processedResources = _.map(resources, this.setCompound);
    return this._receiveData(processedResources);
  },

  setCompound(resource) {
    const processedResource = _.extend({}, resource);
    processedResource.compound = resource.compound || null;
    return processedResource;
  },

  // Case insensitive search on fields in resources
  getAllForQuery(query) {
    return this.getAll()
      .filter(resource => _.some(['name', 'kind', 'id'], field => matches(resource.get(field), query)));
  }
});

ResourceStore._register(Dispatcher);

export default ResourceStore;
