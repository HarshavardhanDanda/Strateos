import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const RunsPageState = rootNode.sub(['runsPageStateStore']);
const CalenderViewModalState = rootNode.sub(['CalenderViewModalStateStore']);

const RunsStateDefaults = {
  query: '',
  lab_id: 'all',
  organization_id: 'all',
  operator_id: null,
  org_name: '',
  status: 'aborted,accepted,complete,in_progress',
  page: 1,
  list_key: 'defaultKey',
  per_page: getDefaultSearchPerPage(),
  direction: 'desc',
  loading: false,
  reset_disabled: true
};

RunsPageState.set(
  _.extend({}, RunsStateDefaults)
);

const CalenderViewModalDefaults = {
  lab_id: '',
  run_date: new Date(),
  organization_id: 'all',
  org_name: '',
  operator_ids: []
};

CalenderViewModalState.set(
  _.extend({}, CalenderViewModalDefaults)
);

export { RunsPageState, RunsStateDefaults, CalenderViewModalState, CalenderViewModalDefaults };
