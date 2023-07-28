import rootNode from 'main/state/rootNode';
import _ from 'lodash';

import { getDefaultSearchPerPage } from 'main/util/List';

const BatchesPageState = rootNode.sub(['batchesPageStateStore']);

const BatchesSearchDefaults = {
  searchInput: '',
  searchQuery: '',
  searchField: 'all',
  searchPage: 1,
  searchSortBy: 'created_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  synthesisRequest: { id: '', name: '' },
  searchCreator: 'all',
  searchSimilarity: '',
  synthesisProgram: { id: '', name: '' },
  searchPurity: { min: '', max: '', hasError: false },
  searchMassYield: { min: '', max: '', hasError: false }
};

const BatchesStateDefaults = {
  isSearching: false,
  selected: []
};

BatchesPageState.set(
  _.extend({}, BatchesStateDefaults, BatchesSearchDefaults)
);

export {
  BatchesPageState,
  BatchesSearchDefaults
};
