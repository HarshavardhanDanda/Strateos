import _ from 'lodash';
import ajax from 'main/util/ajax';
import MaterialActions from 'main/actions/MaterialActions';
import { CompoundSourceSelectorModalState } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import { CompoundSourceSelectorModalActions } from './CompoundSourceActions';

const CompoundSourceMaterialActions = {
  ...CompoundSourceSelectorModalActions,

  search_queue: _.debounce(ajax.singly(), 400),

  doSearch(searchOptions, onSearchFailed, onSearchSucceed = () => {}) {
    const searchSortBy = searchOptions.searchSortBy;
    const descending = searchOptions.descending;
    const sort = descending ? `-${searchSortBy}` : searchSortBy;

    const indexOptions = {
      sortBy: [sort],
      filters: {
        query: searchOptions.searchInput,
        material_type: 'individual',
        provisionable: true
      },
      includes: [
        'supplier',
        'vendor',
        'organization',
        'material_components.resource',
        'orderable_materials',
      ],
      page: searchOptions.searchPage,
      limit: searchOptions.searchPerPage,
      query: searchOptions.searchQuery
    };

    if (!_.isEmpty(searchOptions.compound_id)) {
      indexOptions.filters.compound_id = searchOptions.compound_id;
    }

    if (!_.isEmpty(searchOptions.searchSupplier)) {
      indexOptions.filters.suppliers = searchOptions.searchSupplier.join();
    }

    this.updateState({
      isSearching: true
    });
    return this.search_queue((next) => {
      const promise = MaterialActions.search(indexOptions);
      promise.done(() => {
        this.updateState(searchOptions);
      });
      promise.always(() => {
        onSearchSucceed();
        this.updateState({
          isSearching: false
        });
        return next();
      });
      return promise.fail(xhr => onSearchFailed(xhr));
    });
  }
};

const CompoundSourceSelectorMaterialModalActions = _.extend({}, CompoundSourceMaterialActions, {
  stateStore: CompoundSourceSelectorModalState
});

export { CompoundSourceSelectorMaterialModalActions };
