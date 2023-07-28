import _ from 'lodash';
import Immutable from 'immutable';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import SessionStore from 'main/stores/SessionStore';

const ContextualCustomPropertyConfigStore = _.extend({ _cachedCcpc: Immutable.Map() }, CRUDStore('contextual_custom_properties_config'), {
  act(action) {
    let ccpc;
    switch (action.type) {
      case 'CONTEXTUAL_CUSTOM_PROPERTIES_CONFIGS_API_LIST':
        ccpc = this._receiveData(action.entities);
        this.cacheCcpc();
        return ccpc;
      default:
    }
  },

  cacheCcpc() {
    const groupByOrg = this.getAll().groupBy(ccpc => ccpc.get('organization_id'));
    this._cachedCcpc = groupByOrg.map(org => org.groupBy(ccpc => ccpc.get('context_type')));
  },

  loadCustomPropertiesConfig(organization_id, contextType) {
    const orgId = organization_id || SessionStore.getOrg().get('id');
    const configs = this._cachedCcpc.getIn([orgId, contextType], Immutable.List());
    return contextType === 'Run' ? this.formatContextualCustomPropertiesConfigResponse(configs.toJS()) : configs;
  },

  formatContextualCustomPropertiesConfigResponse(configs) {
    const configObj = {};
    configs.forEach((config) => {
      configObj[config.key] = config.config_definition;
    });
    return configObj;
  }
});

ContextualCustomPropertyConfigStore._register(Dispatcher);

export default ContextualCustomPropertyConfigStore;
