import _ from 'lodash';
import rootNode from 'main/state/rootNode';
import Immutable from 'immutable';

import { getDefaultSearchPerPage } from 'main/util/List';

const CompoundSourceSelectorModalState =  rootNode.sub(['ContainerSelectorModalState']);

const ContainerSearchDefaults = {
  searchInput: '',
  searchQuery: '*',
  searchPage: 1,
  searchSortBy: 'updated_at',
  descending: true,
  include: ['container_type', 'aliquots.compounds', 'aliquots.resource&.compound'],
  searchFields: ['label'],
  selected: [],
  searchPerPage: getDefaultSearchPerPage()
};

const MaterialSearchDefaults = {
  searchInput: '',
  searchPage: 1,
  searchSortBy: 'updated_at',
  descending: true,
  searchPerPage: getDefaultSearchPerPage(),
  selected: [],
  searchQuery: '*'
};

const CommonStateDefaults = {
  isSearching: false,
  searchSource: undefined
};

const EMoleculesStateDefaults = {
  eMoleculesSearchType: 'EXACT',
  numPages: undefined,
  eMoleculesData: Immutable.fromJS({ EXACT: {}, ALTERNATE: {} }),
  eMoleculesCurrentPage: null,
  searchSortBy: 'tier',
  searchPage: 1,
  eMoleculesCurrentData: Immutable.List()
};

CompoundSourceSelectorModalState.set(
  _.extend({}, ContainerSearchDefaults, EMoleculesStateDefaults, CommonStateDefaults)
);

export {  CompoundSourceSelectorModalState, ContainerSearchDefaults, EMoleculesStateDefaults, CommonStateDefaults, MaterialSearchDefaults };
