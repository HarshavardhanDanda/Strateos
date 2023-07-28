import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import InventorySearchAPI from 'main/api/InventorySearchAPI';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerAPI from 'main/api/ContainerAPI';
import { InventoryActions } from 'main/inventory/inventory/InventoryActions';

const defaultErrorHandler = _.bind(NotificationActions.handleError, NotificationActions);
const defaults = {
  query: '*',
  page: 1,
  aliquot_count: 0,
  hide_tubes: false,
  hide_plates: false,
  sort_by: 'updated_at',
  sort_desc: true,
  storage_condition: undefined,
  test_mode: false,
  status: 'available',
  ignore_score: false
};

const ContainerActions = {
  load(id, options) {
    return HTTPUtil.get(Urls.container(id), { options })
      .done(container => Dispatcher.dispatch({ type: 'CONTAINER_DATA', container }));
  },

  loadAll(options) {
    return HTTPUtil.get(Urls.samples(), { options })
      .done(data => Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers: data.results }));
  },

  loadContainers(ids) {
    const data = { filter: { id: ids.join() } };
    return ajax.get(Urls.containers(), data)
      .done(data => {
        JsonAPIIngestor.ingest(data);
      });
  },

  loadContainer(id) {
    const data = { filter: { id: id } };
    return ajax.get(Urls.containers(), data)
      .done(container => Dispatcher.dispatch({ type: 'CONTAINER_DATA', container }));
  },

  loadManyContainers(containerIds) {
    const data = { filter: { id: containerIds }, include: 'location,container_type' };
    return ajax.get(Urls.containers(), data)
      .done((containers) => {
        JsonAPIIngestor.ingest(containers);
      })
      .fail(defaultErrorHandler);
  },

  loadSpecificIds(ids) {
    return ids.forEach(id => this.load(id));
  },

  update(id, values) {
    return ContainerAPI.update(id, values)
      .done((container) => {
        Dispatcher.dispatch({ type: 'CONTAINER_DATA', container });
      })
      .fail(defaultErrorHandler);
  },

  search(searchOptions) {
    const options = { ...defaults, per_page: 10, ...searchOptions };

    return InventorySearchAPI.create(options).fail(defaultErrorHandler);
  },

  create(containers) {
    return ajax.post(Urls.samples_create_with_aliquots(), { containers })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'CONTAINER_LIST',
          containers: data
        });
      })
      .fail(defaultErrorHandler);
  },

  destroyMany(ids, skipNotification = false) {
    const destroyedIds = ids.map(id => this.destroy(id, skipNotification));
    return ajax.when(...destroyedIds);
  },

  destroyBulkContainer(containerIds) {
    return ajax.delete(`${Urls.containers()}/destroy_many`, {
      data: { attributes: { container_ids: containerIds } }
    })
      .done(containers => {
        containers.forEach(container => {
          Dispatcher.dispatch({ type: 'CONTAINER_DELETED', container });
        });
      })
      .fail((...response) => defaultErrorHandler(...response));
  },

  // TODO: consider retire this bulkContainerOperation since UI is no longer using it
  bulkContainerOperation(containers) {
    return ajax.post(`${Urls.containers()}/bulk_operation`, {
      data: { requests: containers }
    }).done(containers => {
      const bulkOperationSuccess = containers.every(container => (!container.error));

      if (bulkOperationSuccess) {
        NotificationActions.createNotification({
          text: `${containers.length} Container(s) deleted`
        });
        ContainerActions.removeContainers(containers);
      }
    })
      .fail((...response) => defaultErrorHandler(...response));
  },

  removeContainers(containers) {
    containers.forEach(container => {
      Dispatcher.dispatch({ type: 'CONTAINER_DELETED', container: { id: container.container_id } });
    });
  },

  destroy(id, skipNotification = false) {
    const promise = ajax.delete(Urls.container(id));

    if (!skipNotification) {
      promise.done(container => this.onDestroy(container));
      promise.fail(defaultErrorHandler);
    }

    return promise;
  },

  destroyManyContainer(ids) {
    const destroyedIds = ids.map(id => this.destroyContainer(id));
    return ajax.when(...destroyedIds);
  },

  destroyContainer(id, purge_store = true) {
    return ajax.delete(`/api/containers/${id}`)
      .done((container) => {
        if (purge_store) {
          Dispatcher.dispatch({ type: 'CONTAINER_DELETED', container });
        } else {
          Dispatcher.dispatch({ type: 'CONTAINER_DATA', container });
        }
      })
      .fail((...response) => defaultErrorHandler(...response));
  },

  onDestroy(container) {
    NotificationActions.createNotification({
      text: `Container queued for destruction ${container.id}`,
      actionText: 'Undo',
      actionCallback: () => this.undoDestroy(container.id)
    });
    Dispatcher.dispatch({
      type: 'CONTAINER_DATA',
      container
    });
  },

  undoDestroy(id) {
    return ajax.post(Urls.container_undo_destroy(id))
      .done(container => this.onUndoDestroy(container))
      .fail(defaultErrorHandler);
  },

  restoreMany(ids) {
    const restoredIds = ids.map(id => this.undoDestroy(id));
    return ajax.when(...restoredIds);
  },

  onUndoDestroy(container) {
    NotificationActions.createNotification({
      text: 'Container destruction canceled'
    });

    Dispatcher.dispatch({
      type: 'CONTAINER_DATA',
      container
    });
  },

  createWithShipment(containers) {
    return ajax.post(`${Urls.samples()}/create_with_shipment`, { containers })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'CONTAINERS_WITH_SHIPMENT',
          containers: data.containers,
          shipment: data.shipment
        });
      })
      .fail(defaultErrorHandler);
  },

  bulkCreateSampleContainers(containers) {
    return ajax.post('/api/containers/bulk_create_sample_containers', { containers })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'CONTAINER_LIST',
          containers: data.containers,
        });
      })
      .fail(defaultErrorHandler);
  },

  bulkRequest(action, searchOptions, expectedRecords, additionalData) {
    const options = InventoryActions.buildSearchPayload(_.omit(searchOptions, 'searchInput'));
    const query = {
      ...defaults,
      ...options,
      per_page: searchOptions.searchPerPage
    };
    const data = {
      context_type: 'container',
      bulk_action: action,
      expected_records: expectedRecords,
      search_query: {
        data: {
          type: 'inventory_searches',
          attributes: query
        }
      }
    };

    // additional_data optional
    // e.g.
    // additional_data: {
    //   location: 'target_location_id'  // additional params needed to perform bulk action
    // }
    if (additionalData) {
      data.additional_data = additionalData;
    }

    return ajax.post(`${Urls.bulk_request_api()}`, { data }).then(response => {
      if (response.data && response.data.id) {
        return response.data.id;
      } else {
        NotificationActions.createNotification({
          text: `Bulk Request ${action} error: request id not found`,
          isError: true
        });
      }
    })
      .fail((...response) => defaultErrorHandler(...response));
  },

  pollForBulkRequest(requestId) {
    const stopPollHttpCodes = [400, 403, 404];
    const makeRequest = () => {
      return ajax.get(`${Urls.bulk_request_api()}/${requestId}?polling=true`)
        .then((res) => {
          const isDone = this.isBulkRequestDone(res);
          // The return value here is the predicate for ajax.poll, this terminates polling if isDone is true
          if (isDone) {
            res.isDone = isDone;
          }
          return res;
        }, (xhr) => {
          return !!stopPollHttpCodes.includes(xhr.status);
        });
    };
    const maxWait = 300000; // 5 min max time out
    const pollInterval = 5000;
    return ajax.poll(makeRequest, pollInterval, maxWait);
  },

  isBulkRequestDone(res) {
    const completedAt = (res.data && res.data.attributes) ? res.data.attributes.completed_at : null;
    // completed_at field indicates whether bulk request is completed or not
    return !_.isEmpty(completedAt);
  },

  validateConsumableBarcodes(containers) {
    return ajax.post(Urls.containers_validate_consumable_barcodes_api(), { containers })
      .done((containers) => {
        JsonAPIIngestor.ingest(containers);
      })
      .fail(defaultErrorHandler);
  },

  validateBarcodes(containers) {
    return ajax
      .post(Urls.containers_validate_barcodes_api(), { containers })
      .fail(defaultErrorHandler);
  },

  loadStock(searchParams, options, httpOptions) {
    const defaults = {
      include_plates: false,
      include_expired: false,
      min_quantity: 0,
      order_by: 'created_at',
      order_desc: false,
      page: 1,
      per_page: 10
    };

    const data = _.extend(defaults, searchParams, options);
    const url = '/api/containers/search_stock';

    const query = data.resource_id;

    return HTTPUtil.get(url, { data, options: httpOptions })
      .done(({ results, num_pages, per_page }) =>
        Dispatcher.dispatch({
          type: 'ADMIN_STOCK_CONTAINER_SEARCH_RESULTS',
          results,
          num_pages,
          per_page,
          page: data.page,
          query // add for search store, which indexes by (query, page)
        }))
      .fail(defaultErrorHandler);
  },

  searchContainer(query, options) {
    const url = '/api/containers/search';

    return ajax.get(url, { ...options, query })
      .done(({ results, num_pages, per_page }) => {
        Dispatcher.dispatch({ type: 'CONTAINER_SEARCH_RESULTS', results, num_pages, per_page });
      })
      .fail(defaultErrorHandler);
  },

  relocate(id, locationId) {
    const containerBeforeUpdate = ContainerStore.getById(id);
    if (containerBeforeUpdate) {
      Dispatcher.dispatch({ type: 'CONTAINER_DATA', container: _.extend({ id }, { location_id: locationId }) });
    }
    return ajax.put(`/api/containers/${id}/relocate`, { location_id: locationId })
      .done((container) => {
        Dispatcher.dispatch({ type: 'CONTAINER_DATA', container });
      })
      .fail((...response) => {
        if (containerBeforeUpdate) {
          Dispatcher.dispatch({ type: 'CONTAINER_DATA', container: containerBeforeUpdate.toJS() });
        }
        defaultErrorHandler(...response);
      });
  },

  relocateMany(container_ids, location_id) {
    return ajax.post(Urls.relocate_many(), { container_ids, location_id })
      .done((response) => {
        response.data.attributes.result_success.forEach((container) => {
          Dispatcher.dispatch({ type: 'CONTAINER_DATA', container: { id: container.id } });
        });
      })
      .fail(defaultErrorHandler);
  },

  requestDestroyContainer(id) {
    return ajax.delete(`/api/containers/${id}/request_destroy`)
      .done(container => {
        Dispatcher.dispatch({ type: 'CONTAINER_DATA', container });
      })
      .fail((...response) => defaultErrorHandler(...response));
  },

  split(id, containers) {
    return ajax.post(`/api/containers/${id}/split`, { containers })
      .done((response) => {
        Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers: response });
      })
      .fail(defaultErrorHandler);
  },

  isTransferable(containers) {
    return ajax.post(Urls.are_containers_transferable(), { containers: containers })
      .fail(defaultErrorHandler);
  },

  restore(id) {
    return ajax.post(`/api/containers/${id}/restore`)
      .done(container => Dispatcher.dispatch({ type: 'CONTAINER_DATA', container }))
      .fail((...response) => defaultErrorHandler(...response));
  },

  getContainerLocationErrors(id, options) {
    return ajax.get(`/api/containers/${id}/errors_for_location_validation`, { options })
      .done(container => Dispatcher.dispatch({ type: 'CONTAINER_DATA', container }))
      .fail(defaultErrorHandler);
  },

  updateMany(container_ids, container) {
    return ajax.put('/api/containers/update_many', {
      data: {
        attributes: {
          container_ids,
          container
        }
      }
    }).done(containers => {
      JsonAPIIngestor.ingest(containers);
    }).fail(defaultErrorHandler);
  },

  updateContainersForTransfer(ids, updates) {
    return ajax.post(Urls.container_transfer(), { container_ids: ids, organization_id: updates.organization_id })
      .fail((...response) => {
        defaultErrorHandler(...response);
      });
  },

  multiTransfer(ids, orgId) {
    const transfer = this.updateContainersForTransfer(ids, { organization_id: orgId });
    return transfer
      .done((response) => {
        // clear from stores since it was transferred
        response.data.attributes.result_success.forEach((container) => {
          Dispatcher.dispatch({ type: 'CONTAINER_DELETED', container: { id: container.id } });
        });
      });
  },

  searchWithoutPagination(searchOptions) {
    searchOptions =  _.omit(searchOptions, 'per_page', 'page');
    return ajax.post(Urls.inventory_search_api(), {
      data: {
        type: 'inventory_searches',
        attributes: { ...defaults, ...searchOptions }
      }
    });
  }
};

export default ContainerActions;
