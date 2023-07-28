import API from 'main/api/API';
import ajax from 'main/util/ajax';
import _ from 'lodash';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import JsonAPIIngestor from './JsonAPIIngestor';
import ContextualCustomProperties from './ContextualCustomProperties';

class CompoundAPI extends API {
  constructor() {
    super('compounds');
  }

  autocompleteLabel(options) {
    const url = this.createUrl(
      '/autocomplete_label',
      options
    );
    return ajax.get(url, options);
  }

  createMany(compounds, ingest = false) {
    const url = this.createUrl('/bulk_create');
    const requestData = {
      data: {
        compounds: compounds
      }
    };

    return ajax.post(url, requestData)
      .done(data => {
        if (ingest) {
          data.compounds.forEach(compound => {
            JsonAPIIngestor.ingest(compound);
          });
        }
      });
  }

  createManyPublic(compounds, ingest = false) {
    const url = this.createUrl('/public_bulk_create');
    const requestData = {
      data: {
        compounds: compounds
      }
    };

    return ajax.post(url, requestData)
      .done(data => {
        if (ingest) {
          data.compounds.forEach(compound => {
            JsonAPIIngestor.ingest(compound);
          });
        }
      });
  }

  createPublicCompound(data, options = {}) {
    const url = this.createUrl('/public_create', options);
    const requestData = { data };

    if (data.type === undefined) data.type = this.resourceName;

    if (options.dryRun) requestData.data.actions = { dry_run: true };

    const response = ajax
      .post(url, requestData)
      .done((data) => JsonAPIIngestor.ingest(data));

    return response;
  }

  updateCustomProperty(compoundId, key, value, options = {}) {
    ContextualCustomProperties.updateCustomProperty(this, compoundId, key, value, options);
  }

  getByContainerId(options) {
    const url = this.createUrl('', options);
    return ajax.get(url);
  }

  get(id, options = {}) {
    return super.get(id, options).done((response) => {
      const contextualCustomProperties = _.get(response.data, 'attributes.contextual_custom_properties');
      ContextualCustomProperties.loadCustomProperties(contextualCustomProperties);
    });
  }

  bulkUpdate(compounds) {
    const url = this.createUrl('/bulk_update');
    const requestData = {
      data: {
        compounds: compounds
      }
    };
    return ajax.post(url, requestData)
      .done((compounds) => {
        Dispatcher.dispatch({ type: 'COMPOUND_DATA', compounds });
      });
  }

  updateCompound(compoundId, attributes) {
    const url = this.createUrl(compoundId);
    const requestData = {
      data: {
        attributes
      }
    };
    return ajax.put(url, requestData);
  }

  addLibrariesToCompound(libraryIds, compoundId) {
    const url = this.createUrl(`${compoundId}/relationships/libraries`);
    const data = libraryIds.map(id => {
      return {
        type: 'libraries',
        id,
      };
    });
    const payload = { data };
    return ajax.post(url, payload)
      .fail((...response) => NotificationActions.handleError(...response));
  }

  removeLibrariesFromCompound(libraryIds, compoundId) {
    const url = this.createUrl(`${compoundId}/relationships/libraries`);
    const data = libraryIds.map(id => {
      return {
        type: 'libraries',
        id,
      };
    });
    const payload = { data };
    return ajax.delete(url, payload)
      .fail((...response) => NotificationActions.handleError(...response));
  }
}

export default new CompoundAPI();
