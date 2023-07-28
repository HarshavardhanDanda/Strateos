import Immutable from 'immutable';
import _ from 'lodash';
import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const CompoundsPageState = rootNode.sub(['compoundsPageStateStore']);
const CompoundsDrawerState = rootNode.sub(['compoundsDrawerStateStore']);
const CompoundSelectorModalState =  rootNode.sub(['CompoundSelectorModalState']);
const CompoundSelectorPublicModalState = rootNode.sub(['CompoundSelectorPublicModalState']);

const CompoundsSearchDefaults = {
  searchInput: '',
  searchLabel: [],
  searchQuery: '',
  searchField: 'all',
  searchSimilarity: '',
  searchPage: 1,
  searchSortBy: 'created_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  includes: [],
  searchVolume: '*',
  searchProperties: {},
  searchGeneration: '*',
  searchContainerStatus: 'all',
  searchCreator: 'all',
  searchSource: 'all',
  searchHazard: [],
  searchWeight: { min: '', max: '' },
  searchTPSA: { min: '', max: '' },
  searchCLOGP: { min: '', max: '' },
  organization_id: undefined,
  searchPublicAndPrivateByOrgId: undefined,
  hasResources: false
};

const CompoundSelectorModalDefaults = {
  ...CompoundsSearchDefaults,
  searchPerPage: getDefaultSearchPerPage()
};

const CompoundSelectorPublicOnlyDefaults = {
  ...CompoundsSearchDefaults,
  searchPerPage: getDefaultSearchPerPage(),
  searchSource: 'public'
};

const CompoundsStateDefaults = {
  createdCompounds: Immutable.Map(),
  currentPane: 'SEARCH', // ['SEARCH', 'CREATE_TUBE', 'CREATE_PLATE', 'VIEW']
  currentCompound: undefined,
  isSearching: false,
  selected: []
};

CompoundsPageState.set(
  _.extend({}, CompoundsStateDefaults, CompoundsSearchDefaults)
);

CompoundsDrawerState.set(
  _.extend({}, CompoundsStateDefaults, CompoundsSearchDefaults)
);

CompoundSelectorModalState.set(
  _.extend({}, CompoundsStateDefaults, CompoundSelectorModalDefaults)
);

CompoundSelectorPublicModalState.set(
  _.extend({}, CompoundsStateDefaults, CompoundSelectorPublicOnlyDefaults)
);

export {
  CompoundsPageState,
  CompoundsDrawerState,
  CompoundSelectorModalState,
  CompoundSelectorPublicModalState,
  CompoundsSearchDefaults,
  CompoundSelectorModalDefaults,
  CompoundSelectorPublicOnlyDefaults
};
