import ContextualCustomPropertiesConfigAPI from 'main/api/ContextualCustomPropertiesConfigAPI';

const MAX_PAGE_SIZE = 10000;

const ContextualCustomPropertiesConfigActions = {

  loadConfig(organization_id, context_type) {
    return ContextualCustomPropertiesConfigAPI.index({
      filters: {
        context_type,
        organization_id
      },
      limit: MAX_PAGE_SIZE
    });
  }

};

export default ContextualCustomPropertiesConfigActions;
