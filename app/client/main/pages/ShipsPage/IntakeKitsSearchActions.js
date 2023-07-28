import _    from 'lodash';
import ajax from 'main/util/ajax';

import IntakeKitsAPI from 'main/api/IntakeKitsAPI';
import {
  IntakeKitsLabPageState,
  IntakeKitsLabPageStateDefaults
} from './IntakeKitsSearchState';

const IntakeKitsSearchActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(IntakeKitsLabPageStateDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchPageChange(onSearchFailed, searchPage) {
    const options = {
      ...this.searchOptions(),
      searchPage
    };

    this.updateState({
      searchPage
    });

    this.doSearch(options, onSearchFailed);
  },

  onSearchFilterChange(onSearchFailed, options) {
    this.updateState(options);

    const mergedOptions = {
      ...this.searchOptions(),
      ...options,
      searchPage: 1
    };

    this.doSearch(mergedOptions, onSearchFailed);
  },

  onSortOptionChange(onSearchFailed, searchSortBy, sortDirection) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      sortDirection
    };

    this.doSearch(options, onSearchFailed);
  },

  doSearch(searchOptions, onSearchFailed, onSearchSucceed = () => {}) {
    const searchSortBy =
      searchOptions.searchSortBy || IntakeKitsLabPageStateDefaults.searchSortBy;
    const sortDirection = searchOptions.sortDirection;
    const sortBy = [
      sortDirection === 'asc' ? searchSortBy : `-${searchSortBy}`
    ];

    this.updateState({ isSearching: true });

    let filters = _.pick(searchOptions, 'status', 'lab_id');

    if (!filters.status) {
      filters = _.omit(filters, 'status');
    }

    const indexOptions = {
      filters,
      limit: searchOptions.searchPerPage,
      page: searchOptions.searchPage,
      sortBy
    };

    return this.search_queue((next) => {
      const promise = IntakeKitsAPI.index(
        indexOptions,
        searchOptions.search_key
      );
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

const IntakeKitsLabSearchActions = _.extend({}, IntakeKitsSearchActions, {
  stateStore: IntakeKitsLabPageState
});

export { IntakeKitsLabSearchActions };
