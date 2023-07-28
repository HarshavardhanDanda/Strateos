import _ from 'lodash';

import ajax from 'main/util/ajax';
import MaterialActions from 'main/actions/MaterialActions';

import {
  MaterialsSearchDefaults,
  MaterialsPageState,
  MaterialsSelectorModalState
} from './MaterialsState';

const MaterialsActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(MaterialsSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchInputChange(onSearchFailed, searchInput) {
    const searchText = _.isEmpty(searchInput) ? '' : searchInput;
    let searchQuery, searchSmiles;
    if (searchText.indexOf('s:') === 0) {
      searchQuery = '';
      searchSmiles = searchText.slice(2);
    } else {
      searchQuery = searchText;
      searchSmiles = null;
    }

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery,
      searchSmiles
    };

    this.updateState({
      searchInput,
      searchSortBy: options.searchSortBy,
      descending: options.descending
    });

    this.doSearch(options, onSearchFailed);
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

  refetch(onSearchFailed = () => {}) {
    this.doSearch({
      ...this.searchOptions()
    }, onSearchFailed);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');
    const searchSortBy = searchOptions.searchSortBy || MaterialsSearchDefaults.searchSortBy;
    const descending = searchOptions.descending;
    const sort = descending ? `-${searchSortBy}` : searchSortBy;

    this.updateState({ isSearching: true });

    const indexOptions = {
      sortBy: [sort],
      filters: {
        query: searchOptions.searchQuery
      },
      page: searchOptions.searchPage,
      limit: searchOptions.searchPerPage,
      includes: ['vendor', 'supplier', 'organization', 'categories', 'orderable_materials.orderable_material_components',
        'material_components.resource', 'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type']
    };

    const { searchType, searchVendor, searchCategory, searchCost, searchCompound, searchSmiles, noAggregation } = searchOptions;

    if (!_.isEmpty(searchType) && searchType !== 'all') {
      indexOptions.filters.material_type = searchType;
    }

    if (!_.isEmpty(searchVendor) && searchVendor !== 'all') {
      indexOptions.filters.vendor_id = searchVendor;
    }

    if (!_.isEmpty(searchCategory) && searchCategory !== 'all') {
      indexOptions.filters.category_id = searchCategory;
    }

    if (!_.every(searchCost, _.isEmpty)) {
      indexOptions.filters.cost = _.omitBy(searchCost, _.isEmpty);
    }

    if (!_.isEmpty(searchCompound)) {
      indexOptions.filters.compound_id = searchCompound;
    }

    if (searchSmiles === '' || !_.isEmpty(searchSmiles))  {
      indexOptions.filters.smiles = searchSmiles;
    }

    if (noAggregation) {
      indexOptions.custom_params = {
        no_aggregation: true
      };
    }

    return this.search_queue((next) => {
      const promise = MaterialActions.search(indexOptions);

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

const MaterialsPageActions = _.extend({}, MaterialsActions, {
  stateStore: MaterialsPageState
});

const MaterialsSelectorModalActions = _.extend({}, MaterialsActions, {
  stateStore: MaterialsSelectorModalState
});

export {
  MaterialsPageActions,
  MaterialsSelectorModalActions
};
