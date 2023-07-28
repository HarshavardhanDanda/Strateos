/* eslint-disable camelcase */
import ajax from 'main/util/ajax';
import BatchAPI from 'main/api/BatchAPI';
import _ from 'lodash';

import { CompoundBatchesState, CompoundBatchesSearchDefaults } from './CompoundBatchesState';

const CompoundBatchesActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(CompoundBatchesSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  onSearchPageChange(onSearchFailed, searchPage, searchPerPage, onSearchSucceed = () => { }) {
    const options = {
      ...this.searchOptions(),
      searchPage,
      searchPerPage
    };

    this.updateState({
      searchPage,
      searchPerPage
    });

    this.doSearch(options, onSearchFailed, (result) => onSearchSucceed(result));
  },

  onSortOptionChange(onSearchFailed, searchSortBy, descending, onSearchSucceed = () => { }) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      descending
    };

    this.doSearch(options, onSearchFailed, (results) => onSearchSucceed(results));
  },

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchFilterChange(onSearchFailed, options) {
    this.updateState(options.toJS());

    const mergedOptions = {
      ...this.searchOptions(),
      searchPage: 1
    };

    this.doSearch(mergedOptions, onSearchFailed);
  },

  onSearchInputChange(onSearchFailed, searchInput) {

    this.updateState({
      searchInput
    });

    const options = {
      ...this.searchOptions(),
      searchPage: 1
    };

    this.doSearch(options, onSearchFailed);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    const searchOptions = searchOptionsParam;
    const searchSortBy = searchOptions.searchSortBy || CompoundBatchesSearchDefaults.searchSortBy;
    const descending = searchOptions.descending;
    const sortBy = [descending ? `-${searchSortBy}` : searchSortBy];

    this.updateState({ isSearching: true });
    const indexOptions = {
      sortBy,
      page: searchOptions.searchPage,
      limit: searchOptions.searchPerPage,
      version: 'v1',
      filters: {
        compound_link_id: searchOptions.compound_link_id
      },
      includes: ['containers']
    };

    if (!_.isEmpty(searchOptions.container_types)) {
      indexOptions.filters['containers.container_type.id'] = searchOptions.container_types.join();
    }

    if (!_.isEmpty(searchOptions.searchInput)) {
      indexOptions.filters.id = searchOptions.searchInput;
    }

    return this.search_queue((next) => {
      const promise = BatchAPI.index(indexOptions);
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

const CompoundBatchesPageActions = _.extend({}, CompoundBatchesActions, {
  stateStore: CompoundBatchesState
});

export { CompoundBatchesPageActions };
