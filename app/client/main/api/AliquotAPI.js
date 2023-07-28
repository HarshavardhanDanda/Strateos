import API from 'main/api/API';
import ajax from 'main/util/ajax';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import ContextualCustomProperties from './ContextualCustomProperties';

class AliquotAPI extends API {
  constructor() {
    super('aliquots');
  }

  getByContainerAndIndex(containerId, wellIndex, options = {}) {
    const filters        = options.filters || {};
    filters.container_id = containerId;
    filters.well_idx     = wellIndex;

    const extendedOptions = { ...options, filters };

    return this.index(extendedOptions);
  }

  getByContainerId(containerId, options = {}) {
    const filters        = options.filters || {};
    filters.container_id = containerId;
    const extendedOptions = { ...options, filters };

    return this.index(extendedOptions);
  }

  getAllByContainerId(containerId, options = {}) {
    const filters        = options.filters || {};
    filters.container_id = containerId;
    const extendedOptions = { ...options, filters };

    return this.indexAll(extendedOptions);
  }

  getManyByContainerIds(containerIds, options = {}) {
    const promises = containerIds.map((containerId) => {
      return this.getByContainerId(containerId, options);
    });

    return ajax.when(...promises);
  }

  getManyByContainerAndIndex(values, options = {}) {
    const promises = values.map((value) => {
      const containerId = value[0];
      const wellIndex   = value[1];
      return this.getByContainerAndIndex(containerId, wellIndex, options);
    });

    return ajax.when(...promises);
  }

  modifyProperties(id, setMap, destroyMap = [], options = {}) {
    const url = this.createUrl(`/${id}/modify_properties`, options);

    const requestData = {
      data: {
        type: this.resourceName,
        id: id,
        set: setMap,
        delete: destroyMap
      }
    };

    const response = ajax.put(url, requestData);

    response.done(payload => JsonAPIIngestor.ingest(payload));

    return response;
  }

  updateCustomProperty(aliquotId, key, value, options = {}) {
    ContextualCustomProperties.updateCustomProperty(this, aliquotId, key, value, options);
  }
}

export default new AliquotAPI();
