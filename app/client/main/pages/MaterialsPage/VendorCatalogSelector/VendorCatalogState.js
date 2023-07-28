import _ from 'lodash';
import rootNode from 'main/state/rootNode';

const VendorCatalogPageState = rootNode.sub(['emoleculesPageStateStore']);

const VendorCatalogSearchDefaults = {
  searchSmiles: '',
  searchSimilarity: 'all'
};

const VendorCatalogStateDefaults = {
  isSearching: false,
  selected: []
};

VendorCatalogPageState.set(
  _.extend({}, VendorCatalogStateDefaults, VendorCatalogSearchDefaults)
);

export {
  VendorCatalogPageState,
  VendorCatalogSearchDefaults
};
