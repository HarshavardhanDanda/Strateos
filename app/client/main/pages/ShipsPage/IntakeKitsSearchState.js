import _ from 'lodash';

import rootNode from 'main/state/rootNode';
import { getDefaultSearchPerPage } from 'main/util/List';

const IntakeKitsLabPageState = rootNode.sub(['intakeKitsLabPageState']);

const IntakeKitsLabPageStateDefaults = {
  search_key: 'intake_kit_lab_search',
  status: undefined,
  searchPage: 1,
  searchSortBy: 'created_at',
  searchPerPage: getDefaultSearchPerPage(),
  sortDirection: 'desc',
  isSearching: false,
  lab_id: undefined
};

IntakeKitsLabPageState.set(_.extend({}, IntakeKitsLabPageStateDefaults));

export { IntakeKitsLabPageState, IntakeKitsLabPageStateDefaults };
