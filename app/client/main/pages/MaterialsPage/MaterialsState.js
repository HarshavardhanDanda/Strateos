import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const MaterialsPageState = rootNode.sub(['materialsPageStateStore']);
const MaterialsSelectorModalState = rootNode.sub(['materialsSelectorModalStateStore']);

const MaterialsSearchDefaults = {
  searchInput: '',
  searchQuery: '',
  searchPage: 1,
  searchSortBy: 'created_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  searchType: 'all',
  searchVendor: 'all',
  searchCategory: 'all',
  searchCost: { min: '', max: '' },
  searchCompound: '',
  searchSmiles: null,
  noAggregation: false
};

const MaterialsStateDefaults = {
  isSearching: false,
  selected: []
};

const MaterialsSelectorModalDefaults = {
  ...MaterialsSearchDefaults,
  searchPerPage: '6',
  searchType: 'group'
};

const IndividualMaterialsSelectorModalDefaults = {
  ...MaterialsSearchDefaults,
  searchPerPage: '6',
  searchType: 'individual'
};

MaterialsPageState.set(
  _.extend({}, MaterialsStateDefaults, MaterialsSearchDefaults)
);

MaterialsSelectorModalState.set(
  _.extend({}, MaterialsStateDefaults, MaterialsSelectorModalDefaults)
);

export {
  MaterialsPageState,
  MaterialsSelectorModalState,
  MaterialsSearchDefaults,
  MaterialsSelectorModalDefaults,
  IndividualMaterialsSelectorModalDefaults
};
