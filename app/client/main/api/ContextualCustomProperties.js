import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';

/**
 * updateCustomProperty can be used for create new or update custom property based on context
 * @param {object} thisInstance: API instance, used to create different base url
 * @param {string} contextId: context id, container id, aliquot id e.g.
 * @param {string} key: key of the contextual customer property configuration
 * @param {string} value: value to be saved/updated
 * @param {object} options
 * @returns promise
 */
const updateCustomProperty = (thisInstance, contextId, key, value, options = {}) => {
  const configsPath = 'contextual_custom_properties_configs';
  const url = thisInstance.createUrl(`/${contextId}/${configsPath}/${key}`, options);
  const requestData = { value: value };

  return ajax.post(url, requestData)
    .done((customProperty) => {
      const updatedEntity = {
        ...customProperty,
        key,
        type: 'contextual_custom_properties' // supply type property to make contextual custom property stay consistent
      };

      delete updatedEntity.contextual_custom_properties_config; // To keep the data model the same, before backend removes it
      Dispatcher.dispatch({
        type: 'CONTEXTUAL_CUSTOM_PROPERTIES_API_LIST',
        entities: [updatedEntity]
      });
    })
    .fail((...response) => NotificationActions.handleError(...response));
};

/**
 * Replaces and updates store with given list of properties
 * @param {array} properties: list of properties to load
 */
const loadCustomProperties = (properties = []) => {
  Dispatcher.dispatch({
    type: 'CONTEXTUAL_CUSTOM_PROPERTIES_API_LIST',
    entities: properties
  });
};

export default { updateCustomProperty, loadCustomProperties };
