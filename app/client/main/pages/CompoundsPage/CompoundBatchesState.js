import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const CompoundBatchesState = rootNode.sub(['batchesStateStore']);

const CompoundBatchesSearchDefaults = {
  searchInput: '',
  searchPage: 1,
  searchSortBy: 'created_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  compound_link_id: undefined,
  container_types: []
};

const CompoundBatchesStateDefaults = {
  isSearching: false,
};

CompoundBatchesState.set(
  _.extend({}, CompoundBatchesStateDefaults, CompoundBatchesSearchDefaults)
);

export {
  CompoundBatchesState,
  CompoundBatchesSearchDefaults
};
