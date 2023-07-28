import _ from 'lodash';
import { Molecule as OCLMolecule } from 'openchemlib';

import ajax from 'main/util/ajax';
import ContainerActions from 'main/actions/ContainerActions';
import UserActions from 'main/actions/UserActions';
import {
  InventorySearchDefaults,
  InventoryDrawerState,
  InventoryPageState,
  InventorySelectorModalAliquotState,
  InventorySelectorModalContainerState,
  ContainersPageState
} from 'main/inventory/inventory/InventoryState';
import SessionStore from 'main/stores/SessionStore';
import UserPreference from 'main/util/UserPreferenceUtil';

const InventoryActions = {
  get() {
    const locallySavedFilters = this.loadFiltersFromLocal();
    return _.extend({}, this.stateStore.get(), locallySavedFilters);
  },

  searchOptions() {
    const locallySavedFilters = this.loadFiltersFromLocal();
    return _.pick(
      _.extend({}, this.stateStore.get(), locallySavedFilters),
      ...Array.from(Object.keys(InventorySearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 400),

  loadFiltersFromLocal()  {
    return UserPreference.get(this.stateStore.path[1]);
  },

  filtersToBeSavedLocally() {
    return _.pick(this.stateStore.get(),
      ['searchInput',
        'searchQuery',
        'searchSmiles',
        'searchPage',
        'aliquot_count',
        'searchSortBy',
        'descending',
        'searchContainerType',
        'searchStorageCondition',
        'searchLocation',
        'searchPerPage',
        'searchVolume',
        'searchStatus',
        'searchProperties',
        'searchContainerProperties',
        'searchAliquotProperties',
        'searchCustomProperties',
        'searchAliquotCustomProperties',
        'searchGeneration',
        'searchEmptyMass',
        'unusedContainers',
        'generatedContainers',
        'include',
        'searchHazard',
        'createdBy',
        'organization_id',
        'createdAfter',
        'createdBefore',
        'bulkSearch'
      ]);
  },

  saveFiltersLocally() {
    UserPreference.save({ [this.stateStore.path[1]]: this.filtersToBeSavedLocally() });
  },

  initializeStoreState(state = {}) {
    const locallySavedFilters = this.loadFiltersFromLocal();
    this.stateStore.set(_.extend({}, this.stateStore.get(), state, locallySavedFilters));
  },

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
    if (this.stateStore.path[1] == 'inventoryPageStateStore') {
      this.saveFiltersLocally();
    }
  },

  onSearchInputChange(onSearchFailed, searchInput, onlyShowTestContainers) {
    const trimmedSearchInput = searchInput && searchInput.trim();
    const searchQuery = _.isEmpty(trimmedSearchInput) ? '*' : trimmedSearchInput;

    const prevQuery = this.searchOptions().searchQuery;

    this.updateState({
      searchInput,
      searchQuery
    });

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery
    };

    if (onlyShowTestContainers != undefined) {
      options.onlyShowTestContainers = onlyShowTestContainers;
    }
    if (prevQuery !== searchQuery) {
      this.doSearch(options, onSearchFailed);
    }
  },

  onSearchSmileChange(onSearchFailed, searchInput, onlyShowTestContainers) {
    const searchSmiles = _.isEmpty(searchInput) ? '' : searchInput;

    this.updateState({
      searchSmiles
    });

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchSmiles,
    };

    /* Check the searchSmiles string validity and throw error if it is invalid */
    try {
      OCLMolecule.fromSmiles(searchSmiles);
    } catch (err) {
      return err;
    }

    if (onlyShowTestContainers != undefined) {
      options.onlyShowTestContainers = onlyShowTestContainers;
    }

    return this.doSearch(options, onSearchFailed);
  },

  onSortOptionChange(onSearchFailed, searchSortBy, descending, onlyShowTestContainers) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      descending
    };

    if (onlyShowTestContainers != undefined) {
      options.onlyShowTestContainers = onlyShowTestContainers;
    }

    this.doSearch(options, onSearchFailed);
  },

  onSearchPageChange(onSearchFailed, searchPage, onlyShowTestContainers) {
    const options = {
      ...this.searchOptions(),
      searchPage
    };

    if (onlyShowTestContainers != undefined) {
      options.onlyShowTestContainers = onlyShowTestContainers;
    }

    this.doSearch(options, onSearchFailed);
  },

  onSearchFilterChange(onSearchFailed, options, onlyShowTestContainers) {
    this.updateState(options.toJS());

    const mergedOptions = {
      ...this.searchOptions(),
      ...options.toJS(),
      searchPage: 1
    };

    if (onlyShowTestContainers != undefined) {
      mergedOptions.onlyShowTestContainers = onlyShowTestContainers;
    }

    this.doSearch(mergedOptions, onSearchFailed);
  },

  refetch(onSearchFailed = () => {}) {
    this.doSearch({
      ...this.searchOptions()
    }, onSearchFailed);
  },

  buildSearchPayload(searchOptions) {
    let generated;
    let shipped;
    let materials;
    let searchFields;
    const user = SessionStore.getUser();

    const sort_by = searchOptions.searchSortBy;
    const sort_desc = searchOptions.descending;
    const hide_tubes = searchOptions.searchContainerType.includes('plates') && !searchOptions.searchContainerType.includes('tubes');
    const hide_plates = searchOptions.searchContainerType.includes('tubes') && !searchOptions.searchContainerType.includes('plates');
    const show_containers_without_runs = searchOptions.unusedContainers.includes('showUnusedContainers');
    const hide_containers_with_pending_runs = searchOptions.generatedContainers.includes('hidePendingContainers');

    if (searchOptions.searchGeneration === 'generated') {
      generated = true;
    }
    if (searchOptions.searchGeneration === 'shipped') {
      shipped = true;
    }

    if (searchOptions.searchGeneration === 'materials') {
      materials = true;
    }

    if (searchOptions.searchField && searchOptions.searchField !== 'all') {
      searchFields = [searchOptions.searchField];
    } else {
      searchFields = ['label', 'id', 'barcode'];
    }

    let storage_condition = searchOptions.searchStorageCondition;
    // When the value is all, we don't want the server to filter.
    if (storage_condition === 'all') {
      storage_condition = undefined;
    }

    let created_by = searchOptions.createdBy;
    if (created_by === 'me') {
      created_by = user.get('id');
    } else {
      created_by = undefined;
    }

    const volume = searchOptions.searchVolume;

    const onlyShowTestContainers = searchOptions.onlyShowTestContainers;

    const smiles = searchOptions.searchSmiles;
    const compound = {
      notation: 'smiles',
      value: smiles,
      exact_match: 'false',
      similarity_threshold: 1
    };

    const locations = [];
    const locations_deep = [];
    searchOptions.searchLocation.forEach((location) => {
      if (location.includeDeep) {
        locations_deep.push(location.id);
      } else {
        locations.push(location.id);
      }
    });

    let containerTypes;
    const containerTypesFilter = this.stateStore && this.stateStore.get && this.stateStore.get().defaultFilters
      && this.stateStore.get().defaultFilters.containerTypes;
    if (searchOptions.searchContainerType && searchOptions.searchContainerType.length > 0) {
      // This is to remove tubes and plates from the search query for container_type_id
      containerTypes = _.difference(searchOptions.searchContainerType, ['tubes', 'plates']);
    } else if (containerTypesFilter) {
      containerTypes = containerTypesFilter;
    } else {
      containerTypes = [];
    }

    return {
      query: searchOptions.searchQuery,
      search_fields: searchFields,
      ...(!_.isEmpty(smiles) && { compound }),
      ...(!_.isEmpty(locations) && { locations }),
      ...(!_.isEmpty(locations_deep) && { locations_deep }),
      per_page: searchOptions.searchPerPage,
      aliquot_count: searchOptions.aliquot_count,
      page: searchOptions.searchPage,
      sort_by,
      sort_desc,
      hide_tubes,
      hide_plates,
      show_containers_without_runs,
      hide_containers_with_pending_runs,
      storage_condition,
      volume: volume,
      status: searchOptions.searchStatus,
      contextual_custom_properties: searchOptions.searchCustomProperties,
      aliquot_contextual_custom_properties: searchOptions.searchAliquotCustomProperties,
      container_properties: searchOptions.searchContainerProperties,
      aliquot_properties: searchOptions.searchAliquotProperties,
      shipped,
      generated,
      materials,
      search_score: true,
      include: searchOptions.include || [],
      test_mode: onlyShowTestContainers,
      search_hazard: searchOptions.searchHazard || [],
      container_type: containerTypes,
      empty_mass: { min: parseFloat(searchOptions.searchEmptyMass.min), max: parseFloat(searchOptions.searchEmptyMass.max) },
      created_by: created_by,
      lab_id: searchOptions.runsLabId,
      organization_id: searchOptions.organization_id,
      created_after: searchOptions.createdAfter,
      created_before: searchOptions.createdBefore,
      bulk_search: searchOptions.bulkSearch || []
    };
  },

  doSearch(searchOptionsParam, onSearchFailed = () => {}, onSearchSucceed = () => {}) {
    // we always update the search input immediately
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');

    const newSearchOptions = this.buildSearchPayload(searchOptions);

    this.updateState({
      isSearching: true
    });

    return this.search_queue((next) => {
      const promise = ContainerActions.search(newSearchOptions);
      promise.done((results) => {
        const totalRecordCount = results.meta.record_count;
        this.updateState({
          searchSortBy: searchOptions.searchSortBy,
          descending: searchOptions.descending,
          searchPage: searchOptions.searchPage,
          totalRecordCount: totalRecordCount
        });
        results.data.map((result) =>  result.attributes.created_by && UserActions.load(result.attributes.created_by));
        onSearchSucceed(results);
      });
      promise.always(() => {
        this.updateState({
          isSearching: false
        });
        return next();
      });
      return promise.fail(xhr => onSearchFailed(xhr));
    });
  }
};

const InventoryPageActions = _.extend({}, InventoryActions, {
  stateStore: InventoryPageState
});
const InventoryDrawerActions = _.extend({}, InventoryActions, {
  stateStore: InventoryDrawerState
});
const InventorySelectorModalContainerActions = _.extend({}, InventoryActions, {
  stateStore: InventorySelectorModalContainerState
});
const InventorySelectorModalAliquotActions = _.extend({}, InventoryActions, {
  stateStore: InventorySelectorModalAliquotState
});
const ContainersPageActions = _.extend({}, InventoryActions, {
  stateStore: ContainersPageState
});

export {
  InventoryPageActions,
  InventoryDrawerActions,
  InventorySelectorModalContainerActions,
  InventorySelectorModalAliquotActions,
  ContainersPageActions,
  InventoryActions
};
