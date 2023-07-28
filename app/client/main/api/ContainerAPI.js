import ajax from 'main/util/ajax';
import API from 'main/api/API';
import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';
import ContextualCustomProperties from './ContextualCustomProperties';

class ContainerAPI extends API {
  constructor() {
    super('containers');
  }

  createContainer(c, aliquots) {
    const data = { container: c };
    data.aliquots = aliquots;
    return ajax.post(`${this.createUrl('')}/create`, data)
      .done((container) => {
        Dispatcher.dispatch({ type: 'CONTAINER_CREATED', container });
      });
  }

  bulkCreate(containers) {
    const data = { containers: containers };
    return ajax.post(Urls.bulk_create_containers_api(), data);
  }

  create(containerPairs) {
    const createContainers = containerPairs.map((containerPair) => {
      return this.createContainer(containerPair.get('container'), containerPair.get('aliquots'));
    });

    return ajax.when(...createContainers);
  }

  logOverrideReason(containerData, reason, suggestedLocationId, chosenLocationId) {
    const container_id = containerData.get('id');
    const log = {
      reason,
      suggested_location_id:       suggestedLocationId,
      container_id,
      chosen_location_id:          chosenLocationId,
      container_storage_condition: containerData.get('storage_condition'),
      container_type_id:           containerData.getIn(['container_type', 'id']) || containerData.get('container_type_id'),
      initial_location_id:         containerData.get('location_id')
    };
    return ajax.post(`${this.createUrl('')}/log_location_override`, log);
  }

  logLocationPickSuccess(containerData, suggestedLocationId) {
    const container_id = containerData.get('id');
    const log = {
      suggested_location_id:       suggestedLocationId,
      container_id,
      container_storage_condition: containerData.get('storage_condition'),
      container_type_id:           containerData.getIn(['container_type', 'id']) || containerData.get('container_type_id'),
      initial_location_id:         containerData.get('location_id')
    };
    return ajax.post(`${this.createUrl('')}/log_location_pick_success`, log);
  }

  updateCustomProperty(containerId, key, value, options = {}) {
    ContextualCustomProperties.updateCustomProperty(this, containerId, key, value, options);
  }
}

export default new ContainerAPI();
