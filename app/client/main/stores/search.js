/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';
import Immutable from 'immutable';

import Dispatcher from 'main/dispatcher';
import rootNode from 'main/state/rootNode';
import ContainerStore from 'main/stores/ContainerStore';
import UserStore from 'main/stores/UserStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import ProjectStore from 'main/stores/ProjectStore';
import StaleContainerStore from 'main/stores/StaleContainerStore';
import CompoundStore from 'main/stores/CompoundStore';
import ResourceStore from 'main/stores/ResourceStore';
import MaterialStore from 'main/stores/MaterialStore';
import BatchStore from 'main/stores/BatchStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import IntakeKitStore from 'main/stores/IntakeKitStore';
import MaterialOrderStore from 'main/stores/MaterialOrderStore';
import VendorCatalogStore from 'main/stores/VendorCatalogStore';

class SearchStore {
  constructor({ storePath, actionType, objectStore }) {
    // stores searches for each search store.
    this.storePath = storePath;
    this.actionType = actionType;
    this.objectStore = objectStore;
    this._searches = rootNode.sub(this.storePath, Immutable.Map());
  }

  register() { this.dispatchToken = Dispatcher.register(this.act.bind(this)); }
  unregister() { Dispatcher.unregister(this.dispatchToken); }

  getSearch(query = '*', page = 1) {
    let search = this._searches.getIn([query, page], Immutable.Map());

    // TODO: should convert all search stores to be backed by CRUDStore
    if (this.objectStore) {
      search = search.set('results', this.getResultsFromSearch(search));
    }

    return search;
  }

  getResultsFromSearch(search) {
    const searchResultIds = search.get('results');
    if (!searchResultIds) { return Immutable.List(); }

    return this.objectStore
      .getByIds(searchResultIds)
      .filter(r => r != undefined);
  }

  getAllSearches() {
    // Map[queryStr, Map[pageStr, Search]]
    const queryToPageMaps = this._searches.get();

    // Array[Map[pageStr, Search]]
    const pageMaps = queryToPageMaps.valueSeq();

    // Array[Array[Search]]
    const nestedSearches = pageMaps.map(pageMap => pageMap.valueSeq());

    // Array[Search]
    return nestedSearches.flatten(true);
  }

  getAllResults(query = '*') {
    const searches = this._searches.get(query, Immutable.Map());
    const allResults = searches.reduce(
      (results, search) => results.concat(search.get('results')),
      Immutable.List()
    );

    if (this.objectStore) {
      return this.objectStore
        .getByIds(allResults)
        .filter(r => r != undefined);
    }

    return allResults;
  }

  getLatestResults() {
    const latestSearch = this.getLatestSearch();
    if (latestSearch) {
      return this.getResultsFromSearch(latestSearch);
    }
    return Immutable.List();
  }

  /* TODO:
   * We should implement __search_created_at and use that instead.
   * Multiple ajax requests could be inflight, and the ordering will
   * be non deterministic.
   */
  getLatestSearch() {
    return this.getAllSearches()
      .sortBy(search => search.get('__search_completed_at'))
      .last();
  }

  remove(id, query, page) {
    let results = this._searches.getIn([query, page, 'results']);

    if (results && results.includes(id)) {
      results = results.filter(data => data !== id);
      return this._searches.setIn([query, page, 'results'], results);
    }
  }

  resetStore(query = '*') {
    this._searches.setIn([query], Immutable.Map());
  }

  prependResult(result, query = '*', page = 1) {
    // useful for adding a result on creation, removing the need to re-fetch search results.
    const search = this._searches.getIn([query, page]);

    // prepend if not already present in the results
    if (search && !search.get('results').includes(result.get('id'))) {
      let results = search.get('results').unshift(result.get('id'));
      const perPage = search.get('per_page');
      if (results.size > perPage) {
        results = results.pop();
      }
      return this._searches.setIn([query, page, 'results'], results);
    }
  }

  act(action) {
    switch (action.type) {
      case this.actionType: {
        const { query } = action;
        const { page }  = action;

        // remove unnecessary type information
        const data = _.omit(action, 'type');

        // append metadata
        data.__search_completed_at = Date.now();

        // only store object ids in search store if given object store
        if (this.objectStore) {
          data.results = data.results.map(result => result.id.toString());
        }

        // data MUST contain [query, page, per_page, num_pages, results]
        return this._searches.setIn([query, page], Immutable.fromJS(data));
      }

      default:
    }
  }
}

// Create instances of SearchStore
const ContainerSearchStore =
  new SearchStore({
    storePath: ['container_search_store'],
    actionType: 'CONTAINER_SEARCH_RESULTS',
    objectStore: ContainerStore
  });

const BatchSearchStore =
  new SearchStore({
    storePath: ['batches_search_store'],
    actionType: 'BATCHES_SEARCH_RESULTS',
    objectStore: BatchStore
  });

const ProjectSearchStore =
  new SearchStore({
    storePath: ['project_search_store'],
    actionType: 'PROJECTS_SEARCH_RESULTS',
    objectStore: ProjectStore
  });

const StockContainerSearchStore =
  new SearchStore({
    storePath: ['stock_container_search_store'],
    actionType: 'ADMIN_STOCK_CONTAINER_SEARCH_RESULTS',
    objectStore: ContainerStore
  });

const UserSearchStore =
  new SearchStore({
    storePath: ['user_search_store'],
    actionType: 'USER_SEARCH_RESULTS',
    objectStore: UserStore
  });

const OrganizationSearchStore =
  new SearchStore({
    storePath: ['organization_search_store'],
    actionType: 'ORGANIZATION_SEARCH_RESULTS',
    objectStore: OrganizationStore
  });

const StaleContainerSearchStore =
  new SearchStore({
    storePath: ['stale_containers_search_store'],
    actionType: 'STALE_CONTAINERS_SEARCH_RESULTS',
    objectStore: StaleContainerStore
  });

const CompoundSearchStore =
  new SearchStore({
    storePath: ['compound_search_store'],
    actionType: 'COMPOUNDS_SEARCH_RESULTS',
    objectStore: CompoundStore
  });
const ResourceSearchStore =
  new SearchStore({
    storePath: ['resource_search_store'],
    actionType: 'RESOURCES_SEARCH_RESULTS',
    objectStore: ResourceStore
  });

const MaterialSearchStore =
  new SearchStore({
    storePath: ['material_search_store'],
    actionType: 'MATERIALS_SEARCH_RESULTS',
    objectStore: MaterialStore
  });

const IntakeKitSearchStore =
  new SearchStore({
    storePath: ['intake_kit_search_store'],
    actionType: 'INTAKE_KITS_SEARCH_RESULTS',
    objectStore: IntakeKitStore
  });

const VendorCatalogSearchStore =
  new SearchStore({
    storePath: ['vendor_catalog_search_store'],
    actionType: 'VENDOR_CATALOG_SEARCH_RESULTS',
    objectStore: VendorCatalogStore
  });

const OrdersSearchStore =
  new SearchStore({
    storePath: ['material_orders_search_store'],
    actionType: 'MATERIAL_ORDER_LIST',
    objectStore: MaterialOrderStore
  });

const RunsSearchStore =
  new SearchStore({
    storePath: ['runs_search_store'],
    actionType: 'RUNS_SEARCH_RESULTS'
  });

const CheckinShipmentSearchStore =
  new SearchStore({
    storePath: ['checkin_shipments_search_store'],
    actionType: 'SHIPMENTS_SEARCH_RESULTS',
    objectStore: ShipmentStore
  });

// Register all search stores
ContainerSearchStore.register();
BatchSearchStore.register();
ProjectSearchStore.register();
StockContainerSearchStore.register();
UserSearchStore.register();
OrganizationSearchStore.register();
StaleContainerSearchStore.register();
CompoundSearchStore.register();
ResourceSearchStore.register();
MaterialSearchStore.register();
VendorCatalogSearchStore.register();
RunsSearchStore.register();
OrdersSearchStore.register();
CheckinShipmentSearchStore.register();
IntakeKitSearchStore.register();

export {
  ContainerSearchStore,
  BatchSearchStore,
  ProjectSearchStore,
  StockContainerSearchStore,
  UserSearchStore,
  OrganizationSearchStore,
  StaleContainerSearchStore,
  CompoundSearchStore,
  ResourceSearchStore,
  MaterialSearchStore,
  VendorCatalogSearchStore,
  RunsSearchStore,
  OrdersSearchStore,
  CheckinShipmentSearchStore,
  IntakeKitSearchStore
};
