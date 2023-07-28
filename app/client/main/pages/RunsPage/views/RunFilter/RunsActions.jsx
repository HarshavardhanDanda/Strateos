import _ from 'lodash';
import ajax from 'main/util/ajax';
import RunAPI from 'main/api/RunAPI';
import Immutable from 'immutable';
import { RunsPageState, RunsStateDefaults, CalenderViewModalDefaults, CalenderViewModalState } from 'main/pages/RunsPage/views/RunFilter/RunsState';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import FeatureConstants from '@strateos/features';

const ApprovalsFilterKeys = ['query', 'lab_id', 'organization_id',
  'status', 'page', 'per_page', 'sort_by', 'direction', 'start_date', 'end_date'];
const QueueFilterKeys = ['query', 'lab_id', 'organization_id', 'operator_id',
  'status', 'page', 'per_page', 'sort_by', 'direction', 'start_date', 'end_date'];
const FilterKeys = Immutable.Map([
  ['aborted,accepted,complete,in_progress', QueueFilterKeys],
  ['aborted', QueueFilterKeys],
  ['accepted', QueueFilterKeys],
  ['complete', QueueFilterKeys],
  ['in_progress', QueueFilterKeys],
  ['pending', ApprovalsFilterKeys],
  ['rejected', ApprovalsFilterKeys]
]);
const AllRunFilterKeys = ['lab_id', 'organization_id'];

const RunsActions = {

  search_queue: _.debounce(ajax.singly(), 250).bind(this),

  options() {
    return this.stateStore.get();
  },

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onFilterOptionChanged(currentOptions) {
    this.updateState(currentOptions.toJS());
    this.search_queue((next) => this.loadRuns().always(() => next()));
  },

  loadOperators(callback, contextIds = null) {
    return AccessControlActions.loadPermissions({ featureCode: FeatureConstants.VIEW_RUNS_IN_LABS, contextIds: contextIds })
      .done(permissions => {
        var operatorIds = permissions.map(permission => permission.userId)
          .filter((value, index, array) => array.indexOf(value) === index);
        UserActions.loadUsers(operatorIds);
        callback(operatorIds);
      });
  },

  loadRuns() {
    this.updateState({ loading: true });
    return RunAPI.search(this.buildRunsRequest()).then((res) => {
      const userIds = res.results.map(result => {
        return result.assigned_to_id;
      }).filter((userId) => userId !== null);

      if (!_.isEmpty(userIds)) { UserActions.loadUsers(userIds); }
      this.updateState({ loading: false });
    });
  },

  buildRunsRequest() {
    const filters = this.options();
    const keys = Object.keys(filters);
    const filterKeys = FilterKeys.get(filters.status);
    const query = {};
    keys.forEach((key) => {
      if (filterKeys && filterKeys.includes(key)) {
        query[key] = filters[key];
        if (AllRunFilterKeys.includes(key)) {
          query[key] = [filters[key]];
        }
      }
    });
    return query;
  }
};

const RunsPageActions = _.extend({}, RunsActions, {
  stateStore: RunsPageState,
  defaults: RunsStateDefaults,
  loadData: RunsActions.loadRuns,
  localStorageKey: 'run_filters'
});

const CalenderViewModalActions = _.extend({}, RunsActions, {
  stateStore: CalenderViewModalState,
  defaults: CalenderViewModalDefaults
});

export { RunsPageActions, CalenderViewModalActions };
