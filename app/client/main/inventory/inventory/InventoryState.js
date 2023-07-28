import Immutable from 'immutable';
import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const InventoryPageState = rootNode.sub(['inventoryPageStateStore']);
const InventoryDrawerState = rootNode.sub(['inventoryDrawerStateStore']);
const InventorySelectorModalState = rootNode.sub(['InventorySelectorModalState']);
const InventorySelectorModalContainerState = rootNode.sub(['InventorySelectorModalContainerState']);
const InventorySelectorModalAliquotState = rootNode.sub(['InventorySelectorModalAliquotState']);
const ContainersPageState = rootNode.sub(['containersPageStateStore']);

const InventorySearchDefaults = {
  searchInput: '',
  searchQuery: '*',
  searchField: 'all',
  searchSmiles: '',
  searchPage: 1,
  aliquot_count: 0,
  searchSortBy: 'updated_at',
  descending: true,
  searchContainerType: [],
  searchByType: 'both',
  searchStorageCondition: 'all',
  searchLocation: [],
  searchPerPage: getDefaultSearchPerPage(),
  searchVolume: '*',
  searchStatus: 'available',
  searchProperties: {},
  searchContainerProperties: {},
  searchAliquotProperties: {},
  searchCustomProperties: {},
  searchAliquotCustomProperties: {},
  searchGeneration: '*',
  unusedContainers: [],
  generatedContainers: [],
  searchEmptyMass: { min: '', max: '' },
  include: ['container_type'],
  searchHazard: [],
  createdBy: 'all',
  organization_id: undefined,
  runsLabId: undefined,
  createdAfter: null,
  createdBefore: null,
  bulkSearch: [],
  containerIds: []
};

const InventorySelectorModalDefaults = {
  ...InventorySearchDefaults,
  searchPerPage: getDefaultSearchPerPage()
};
const InventorySelectorModalContainerDefaults = {
  ...InventorySelectorModalDefaults,
  aliquot_count: 0
};
const InventorySelectorModalAliquotDefaults = {
  ...InventorySelectorModalDefaults,
  aliquot_count: 1
};

const InventoryStateDefaults = {
  createdContainers: Immutable.Map(),
  currentPane: 'SEARCH', // ['SEARCH', 'CREATE_TUBE', 'CREATE_PLATE', 'VIEW']
  currentContainer: undefined,
  isSearching: false,
  selected: [],
  defaultFilters: {
    containerTypes: []
  }
};

InventoryPageState.set(
  _.extend({}, InventoryStateDefaults, InventorySearchDefaults)
);

InventoryDrawerState.set(
  _.extend({}, InventoryStateDefaults, InventorySearchDefaults)
);

InventorySelectorModalState.set(
  _.extend({}, InventoryStateDefaults, InventorySelectorModalDefaults)
);

InventorySelectorModalContainerState.set(
  _.extend({}, InventoryStateDefaults, InventorySelectorModalContainerDefaults)
);

InventorySelectorModalAliquotState.set(
  _.extend({}, InventoryStateDefaults, InventorySelectorModalAliquotDefaults)
);
ContainersPageState.set(
  _.extend({}, InventoryStateDefaults, InventorySearchDefaults)
);

export {
  InventoryPageState,
  InventoryDrawerState,
  InventorySearchDefaults,
  InventoryStateDefaults,
  InventorySelectorModalState,
  InventorySelectorModalContainerState,
  InventorySelectorModalAliquotState,
  InventorySelectorModalContainerDefaults,
  InventorySelectorModalAliquotDefaults,
  ContainersPageState
};
