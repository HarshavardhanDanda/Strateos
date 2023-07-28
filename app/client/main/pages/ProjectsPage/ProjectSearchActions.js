import _ from 'lodash';

import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import ProjectActions from 'main/actions/ProjectActions';
import { ProjectSearchDefaults, ProjectPageState } from 'main/pages/ProjectsPage/ProjectPageState';
import { ProjectSearchStore } from 'main/stores/search';

const ProjectSearchActions = {

  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(ProjectSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 400),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchFilterChange(onSearchFailed, options) {

    this.updateState(options.toJS());
    ProjectSearchStore.resetStore(options.get('query'));

    const mergedOptions = {
      ...this.searchOptions(),
      page: 1
    };

    this.doSearch(onSearchFailed, mergedOptions);
  },

  doSearch(onSearchFailed, searchOptions) {
    this.updateState({
      isSearching: true
    });

    const subdomain = Urls.organization().slice(1);

    return this.search_queue((next) => {
      const promise =  ProjectActions.search(subdomain, searchOptions);
      promise.done((projects) => {
        const searchOptions = _.omit(searchOptions, 'query');
        this.updateState({ ...searchOptions, totalProjects: projects.total });
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

const ProjectFiltersActions =  _.extend({}, ProjectSearchActions, {
  stateStore: ProjectPageState
});

export { ProjectFiltersActions };
