import _ from 'lodash';
import { CompoundSourceSelectorModalState } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';

const CompoundSourceActions = {
  searchOptions(getEMoleculesData = true) {
    return getEMoleculesData ? this.stateStore.get() : _.omit(this.stateStore.get(), 'eMoleculesData');
  },

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
      ...this.searchOptions(false),
      searchPage: 1,
      searchQuery,
      searchInput
    };
    this.doSearch(options, onSearchFailed);
  },
  onReSearch(onSearchFailed = () => {}) {
    this.doSearch({
      ...this.searchOptions(false)
    }, onSearchFailed);
  },

  onSortOptionChange(onSearchFailed, searchSortBy, descending) {
    const options = {
      ...this.searchOptions(false),
      searchSortBy,
      descending
    };
    this.doSearch(options, onSearchFailed);
  },

  onSearchPageChange(onSearchFailed, searchPage) {
    const options = {
      ...this.searchOptions(false),
      searchPage
    };
    this.doSearch(options, onSearchFailed);
  },
  onSearchFilterChange(onSearchFailed, options, onSearchSucceed = () => {}) {
    const currOptions = _.omit(options.toJS(), 'eMoleculesData');
    this.updateState(currOptions);
    const mergedOptions = {
      ...this.searchOptions(false),
      ...currOptions
    };
    this.doSearch(mergedOptions, onSearchFailed, onSearchSucceed);
  }
};

const CompoundSourceSelectorModalActions = _.extend({}, CompoundSourceActions, {
  stateStore: CompoundSourceSelectorModalState
});

export { CompoundSourceSelectorModalActions };
