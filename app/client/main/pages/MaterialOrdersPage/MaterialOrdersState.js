import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const MaterialOrdersPageState = rootNode.sub(['materialOrdersPageStateStore']);

const MaterialOrdersSearchDefaults = {
  searchInput: '',
  searchQuery: '*',
  searchField: 'name',
  searchPage: 1,
  searchSortBy: 'created_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  searchLab: 'all',
  searchType: 'all',
  searchVendor: 'all',
  activeStatus: []
};

const MaterialOrdersStateDefaults = {
  isSearching: false,
  selected: []
};

MaterialOrdersPageState.set(
  _.extend({}, MaterialOrdersStateDefaults, MaterialOrdersSearchDefaults)
);

export {
  MaterialOrdersPageState,
  MaterialOrdersSearchDefaults
};
