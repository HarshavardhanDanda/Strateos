import Immutable from 'immutable';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';

interface ContainerObj {
  aliquot_count: number;
  barcode: string;
  container_type_id: string;
  id: string;
  label: string;
  organization_id: string;
  status: string;
  storage_condition: string;
  test_mode: boolean;
  type: string;
  lab: object;
}

interface CustomPropertiesConfigsObj {
  id: string;
  context_type: string;
  organization_id: string;
  key: string;
  config_definition: object;
}

const ContextualCustomPropertyUtil = {
  getCustomPropertyConfigs(container: Immutable.Map<string, ContainerObj>, ctx_type: string) {
    if (container) {
      const orgId = container.get('organization_id');
      const configs = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(orgId, ctx_type);

      return configs.map((config: Immutable.Map<string, CustomPropertiesConfigsObj>) => {
        const configDef = config.get('config_definition');
        if (typeof configDef === 'string') {
          return config.set('config_definition', Immutable.fromJS(JSON.parse(configDef)));
        }

        return config;
      });
    }
  },

  showCPTable(customPropertiesConfigs: Immutable.Map<string, CustomPropertiesConfigsObj>) {
    return !!(customPropertiesConfigs && customPropertiesConfigs.size);
  }
};

export default ContextualCustomPropertyUtil;
