/* eslint-disable camelcase */
import ajax                from 'main/util/ajax';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import _ from 'lodash';

import { MaterialOrdersPageState, MaterialOrdersSearchDefaults } from './MaterialOrdersState';

const MaterialOrdersActions = {
  urlBase: '/api/kit_orders',
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(MaterialOrdersSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  onSearchInputChange(onSearchFailed, searchInput) {
    const searchQuery = _.isEmpty(searchInput) ? '' : searchInput;

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery: searchQuery
    };

    this.updateState({
      searchInput,
      searchSortBy: options.searchSortBy,
      descending: options.descending
    });

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

  onSortOptionChange(onSearchFailed, searchSortBy, descending) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      descending
    };

    this.doSearch(options, onSearchFailed);
  },

  resetSelected() {
    this.updateState({
      selected: []
    });
  },

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

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');
    const searchSortBy = searchOptions.searchSortBy || MaterialOrdersSearchDefaults.searchSortBy;
    const descending = searchOptions.descending;
    const sort = descending ? `-${searchSortBy}` : searchSortBy;
    let status = (searchOptions.activeStatus && searchOptions.activeStatus.length) ?
      searchOptions.activeStatus.join() : '';
    let material_type = searchOptions.searchType;
    let vendor = searchOptions.searchVendor;

    if (status === '') {
      status = undefined;
    }
    if (material_type === 'all') {
      material_type = undefined;
    }
    if (vendor === 'all') {
      vendor = undefined;
    }

    this.updateState({ isSearching: true });

    const indexOptions = {
      sort,
      q: searchOptions.searchQuery,
      search_field: searchOptions.searchField,
      page: searchOptions.searchPage,
      per_page: searchOptions.searchPerPage,
      filter: {
        lab: searchOptions.searchLab,
        material_type,
        vendor,
        status
      }
    };

    return this.search_queue((next) => {
      const promise = MaterialOrderActions.search(indexOptions);

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

const MaterialOrdersPageActions = _.extend({}, MaterialOrdersActions, {
  stateStore: MaterialOrdersPageState
});

export { MaterialOrdersPageActions };
