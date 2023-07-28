/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

const ContainerStore = _.extend({}, CRUDStore('containers'), {
  defaultStorageCondition: 'cold_4',

  validStorageConditions: [
    { value: 'ambient', name: 'Ambient (22 ± 2 °C)' },
    { value: 'cold_4',  name: '4 °C (± 1 °C)' },
    { value: 'cold_20', name: '–20 °C (± 1 °C)' },
    { value: 'cold_80', name: '-80 °C (± 1 °C)' },
    { value: 'cold_196', name: '-196 °C (± 1 °C)' }
  ],

  act(action) {
    switch (action.type) {
      case 'LOCATION_DATA':
        if (action.location.containers) {
          return this._receiveData(action.location.containers);
        }
        return;

      case 'LOCATION_SEARCH_RESULTS': {
        const containers = action.locations.map(l => l.containers);
        return this._receiveData(_.flattenDeep(_.compact(containers)));
      }

      case 'CONTAINERS_API_LIST':
        return this._receiveData(action.entities);

      case 'CONTAINER_DATA': case 'CONTAINER_CREATED':
        return this._receiveData([action.container]);

      case 'CONTAINER_DELETED':
        return this._remove(action.container.id);

      case 'CONTAINER_LIST':
        return this._receiveData(action.containers);

      case 'CONTAINERS_WITH_SHIPMENT':
        return this._receiveData(action.containers);

      case 'ADMIN_CONTAINER_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'CONTAINER_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'SHIPMENT_LIST': {
        const containers = action.shipments.map(s => s.containers);
        return this._receiveData(_.flattenDeep(_.compact(containers)));
      }

      case 'SHIPMENT_DATA': {
        const containers = action.shipment.containers ? action.shipment.containers : [];
        return this._receiveData(containers);
      }

      case 'LAUNCH_RUN_SHIPMENT_DATA':
        return this._receiveData(action.shipment.containers);

      case 'ADMIN_STOCK_CONTAINER_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'ALIQUOT_DATA': {
        // TODO: normalize/flatten stored data.
        // This is exactly why we should be storing all of our data
        // normalized and not storing them in a nested tree.
        const container = this.getById(action.aliquot.container_id);
        const aliquots  = container ? container.get('aliquots') : undefined;
        const index     = aliquots ? aliquots.findIndex(a => a.get('well_idx') === action.aliquot.well_idx) : undefined;

        if (index >= 0) {
          const mergedContainer = container.mergeIn(['aliquots', index], action.aliquot);
          return this._objects.setIn([container.get('id')], mergedContainer);
        }
        return undefined;
      }

      default:
        return undefined;
    }
  },

  containersAt(...location_ids) {
    // Flatten is used below to allow passing a single array directly
    return this.getAll()
      .filter(c => _.includes(_.flattenDeep(location_ids), c.get('location_id')));
  },

  getById(id) {
    return this.getAll().find(container => container.get('id') === id);
  },

  getByIdWithContainerType(id) {
    const container = this.getById(id);
    const container_type = ContainerTypeStore.getById(container.get('container_type_id'));
    // some routes return nested json instead of normalized json so the container_type store
    // will be empty in these cases. The container_type will be present on the container
    // already in these # cases, so we don't want to overwrite it
    if (container_type) {
      return container.merge({ container_type });
    }

    return container;
  },

  getAllByShipment(shipmentId) {
    return this.getAll().filter(c => c.get('shipment_id') === shipmentId);
  },

  getByOmcId(omcId) {
    return this.getAll().filter(c => c.get('orderable_material_component_id') === omcId);
  },

  getManyContainers(containerIds) {
    return this.getByIds(containerIds);
  },

  getByBarcode(barcode) {
    return this.getAll().filter(c => c.get('barcode') === barcode);
  },

});

ContainerStore._register(Dispatcher);

export default ContainerStore;
