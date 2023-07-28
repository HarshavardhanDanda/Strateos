import _ from 'lodash';
import ajax from 'main/util/ajax';
import ContainerActions from 'main/actions/ContainerActions';
import { CompoundSourceSelectorModalState } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import { CompoundSourceSelectorModalActions } from './CompoundSourceActions';

const CompoundSourceContainerActions = {
  ...CompoundSourceSelectorModalActions,

  search_queue: _.debounce(ajax.singly(), 400),

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => {}) {
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');
    const sort_by = searchOptions.searchSortBy;
    const sort_desc = searchOptions.descending;

    this.updateState({
      isSearching: true
    });
    return this.search_queue((next) => {
      const promise = ContainerActions.search({
        query: searchOptions.searchQuery,
        per_page: searchOptions.searchPerPage,
        page: searchOptions.searchPage,
        sort_by,
        sort_desc,
        include: searchOptions.include || [],
        lab_id: searchOptions.lab_id,
        search_fields: searchOptions.searchFields,
        compound_link_id: searchOptions.compound_link_id,
        container_type: searchOptions.container_type,
        compound_count: searchOptions.compound_count,
        phase: searchOptions.phase,
        ...(searchOptions.volume && { volume: { gte: searchOptions.volume } }),
        ...(searchOptions.mass && { mass: { gte: searchOptions.mass } })
      });
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

const CompoundSourceSelectorContainerModalActions = _.extend({}, CompoundSourceContainerActions, {
  stateStore: CompoundSourceSelectorModalState
});

export { CompoundSourceSelectorContainerModalActions };
