import _ from 'lodash';

import ajax from 'main/util/ajax';
import ResourceActions from 'main/actions/ResourceActions';
import {
  ResourcesSearchDefaults,
  ResourcesPageState,
  ResourceSelectorModalState
} from 'main/pages/ResourcesPage/ResourcesState';

const ResourcesSearchActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(ResourcesSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 400),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchInputChange(onSearchFailed, searchInput) {
    const searchQuery = _.isEmpty(searchInput) ? '*' : searchInput;

    this.updateState({
      searchInput
    });

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery
    };

    this.doSearch(options, onSearchFailed);
  },

  onSearchPageChange(onSearchFailed, searchPage) {
    const options = {
      ...this.searchOptions(),
      searchPage
    };

    this.doSearch(options, onSearchFailed);
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

  onSortOptionChange(onSearchFailed, searchSortBy, descending) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      descending
    };

    this.doSearch(options, onSearchFailed);
  },

  onReSearch(onSearchFailed = () => {}) {
    this.doSearch({
      ...this.searchOptions()
    }, onSearchFailed);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => {}) {
    // we always update the search input immediatley

    const searchOptions = _.omit(searchOptionsParam, 'searchInput');

    let storage_condition = searchOptions.searchStorageCondition;

    let kind = searchOptions.searchKind;
    // When the value is all, we don't want the server to filter.
    if (storage_condition === 'all') {
      storage_condition = undefined;
    }

    if (kind === 'all') {
      kind = undefined;
    }

    this.updateState({
      isSearching: true
    });

    return this.search_queue((next) => {
      const promise = ResourceActions.search({
        q: searchOptions.searchQuery,
        per_page: searchOptions.searchPerPage,
        page: searchOptions.searchPage,
        sort_by: searchOptions.searchSortBy,
        sort_desc: searchOptions.descending,
        storage_condition,
        compound_id: searchOptions.compoundId,
        kind
      });
      promise.done((results) => {
        this.updateState(searchOptions);
        onSearchSucceed(results);
      });
      promise.always(() => {
        this.updateState({
          isSearching: false
        });
        return next();
      });
      return promise.fail(xhr => onSearchFailed(xhr));
    });
  }
};

const ResourcesPageSearchActions = _.extend({}, ResourcesSearchActions, {
  stateStore: ResourcesPageState
});

const ResourceSelectorModalActions = _.extend({}, ResourcesSearchActions, {
  stateStore: ResourceSelectorModalState
});

export {
  ResourcesPageSearchActions,
  ResourceSelectorModalActions
};
