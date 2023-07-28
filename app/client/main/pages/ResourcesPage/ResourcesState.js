import _         from 'lodash';
import rootNode  from 'main/state/rootNode';

const ResourcesPageState = rootNode.sub(['resourcesPageStateStore']);
const ResourceSelectorModalState = rootNode.sub(['resourceSelectorModalStateStore']);

const ResourcesStateDefaults = {
  selected: [],
  isSearching: false
};

const ResourcesSearchDefaults = {
  searchInput: '',
  searchQuery: '*',
  searchPage: 1,
  searchKind: 'all',
  searchStorageCondition: 'all',
  searchPerPage: '6',
  searchSortBy: 'updated_at',
  descending: true,
  compoundId: undefined
};

const ResourceSelectorModalDefaults = {
  ...ResourcesSearchDefaults,
  searchSortBy: 'name',
  descending: false
};

ResourcesPageState.set(
  _.extend({}, ResourcesStateDefaults, ResourcesSearchDefaults)
);

ResourceSelectorModalState.set(
  _.extend({}, ResourcesStateDefaults, ResourceSelectorModalDefaults)
);

export {
  ResourcesPageState,
  ResourceSelectorModalState,
  ResourcesSearchDefaults,
  ResourceSelectorModalDefaults
};
