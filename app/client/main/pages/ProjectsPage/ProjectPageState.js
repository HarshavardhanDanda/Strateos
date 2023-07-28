import _         from 'lodash';
import rootNode  from 'main/state/rootNode';

const ProjectPageState = rootNode.sub('[projectPageStateStore]');

const ProjectSearchDefaults = {
  query: '',
  is_starred: false,
  per_page: 50,
  created_at: undefined,
  page: 1,
  customer_organization_id: undefined,
  is_implementation: undefined
};

const ProjectPageStateDefaults = {
  totalProjects: undefined,
  isSearching: false
};

ProjectPageState.set(
  _.extend({}, ProjectSearchDefaults, ProjectPageStateDefaults)
);

export { ProjectPageState, ProjectSearchDefaults };
