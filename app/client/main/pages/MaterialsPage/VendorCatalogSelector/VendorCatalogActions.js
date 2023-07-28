import _ from 'lodash';

import ajax from 'main/util/ajax';
import VendorCatalogActions from 'main/actions/VendorCatalogActions';

import {
  VendorCatalogSearchDefaults,
  VendorCatalogPageState
} from './VendorCatalogState';

const VendorCatalogsActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(VendorCatalogSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  refetch(onSearchFailed = () => {}) {
    this.doSearch({
      ...this.searchOptions()
    }, onSearchFailed);
  },

  onSearchFilterChange(onSearchFailed, options) {
    this.updateState(options.toJS());

    const mergedOptions = {
      ...this.searchOptions(),
      ...options.toJS(),
      searchPage: 1
    };

    this.doSearch(mergedOptions, onSearchFailed);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');

    this.updateState({ isSearching: true });

    const indexOptions = {
      filter: {}
    };

    const { searchSmiles, searchSimilarity } = searchOptions;

    if (!_.isEmpty(searchSmiles)) {
      indexOptions.filter.smiles = searchSmiles;
    }

    if (!_.isEmpty(searchSimilarity)) {
      indexOptions.filter.similarity = searchSimilarity;
    }

    return this.search_queue((next) => {
      const promise = VendorCatalogActions.search(indexOptions);

      promise.done((result) => {
        this.updateState(searchOptions);
        onSearchSucceed(result);
      });
      promise.always(() => {
        this.updateState({ isSearching: false });
        return next();
      });
      return promise.fail((xhr) => {
        onSearchFailed(xhr);
      });
    });
  }
};

const VendorCatalogPageActions = _.extend({}, VendorCatalogsActions, {
  stateStore: VendorCatalogPageState
});

export {
  VendorCatalogPageActions
};
