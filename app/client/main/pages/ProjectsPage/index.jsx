import $         from 'jquery';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';
import { Link }  from 'react-router-dom';

import { Page, Breadcrumbs, Spinner } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import CreateOrEditProjectModal       from 'main/components/CreateOrEditProjectModal';
import { PageLayout, PageHeader }     from 'main/components/PageLayout';
import { TabLayout, TabLayoutTopbar } from 'main/components/TabLayout';
import { ProjectTransferModal }       from 'main/components/TransferModal';
import ConnectToStores                from 'main/containers/ConnectToStoresHOC';
import ProjectSquares                 from 'main/pages/ProjectsPage/ProjectSquares';
import ProtocolBrowserModal           from 'main/project/ProtocolBrowserModal';
import OrganizationStore              from 'main/stores/OrganizationStore';
import { ProjectSearchStore }         from 'main/stores/search';
import ajax                           from 'main/util/ajax';
import Urls                           from 'main/util/urls';
import ProjectActions                 from 'main/actions/ProjectActions';
import FavoriteAPI                    from 'main/api/FavoriteAPI';
import { tour } from 'main/tours/create-implementation';
import RunTransferModal from 'main/components/RunTransferModal';
import {
  ConfirmArchiveModal,
  ConfirmUnarchiveModal,
  ConfirmDeletionModal
} from 'main/pages/ProjectsPage/ProjectActionModals';
import ProjectsSearchFilters from './ProjectsSearchFilters';
import { ProjectPageState } from './ProjectPageState';
import { ProjectFiltersActions }   from './ProjectSearchActions';

const queryString = require('query-string');

export class ProjectsPage extends React.Component {

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  static get propTypes() {
    return {
      results:       PropTypes.object,
      isLoaded:      PropTypes.bool,
      orgId:         PropTypes.string,
      match:         PropTypes.shape({
        params:      PropTypes.shape({
          subdomain: PropTypes.string.isRequired
        })
      })
    };
  }

  static get per_page() {
    return 50;
  }

  constructor(props, context) {
    super(props, context);

    this.refill           = this.refill.bind(this);
    this.globalKeyHandler = this.globalKeyHandler.bind(this);
    this.onSelectProtocol = this.onSelectProtocol.bind(this);
    this.setActiveProject = this.setActiveProject.bind(this);
    this.search           = this.search.bind(this);
    this.onSearchFailed   = this.onSearchFailed.bind(this);
    this.onToggleProjectStar = this.onToggleProjectStar.bind(this);
    this.onTransfer       = this.onTransfer.bind(this);

    this.state = {
      loading: false,
      statusCode: undefined,
      activeProject: undefined
    };
  }

  componentWillMount() {
    // reset last used search if available
    if (!this.props.isLoaded) {
      this.fetch_more();
    }
  }

  componentDidMount() {
    this.request_queue = _.debounce(ajax.singly(), 150);
    window.addEventListener('resize', this.refill);
    window.addEventListener('keydown', this.globalKeyHandler);

    const queryParams = queryString.parse(this.props.location.search);

    if (queryParams.continueTour) {
      tour.show(parseInt(queryParams.step, 10));
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.refill);
    window.removeEventListener('keydown', this.globalKeyHandler);
  }

  onSelectProtocol(protocolId) {
    const url = Urls.run_launch(this.state.activeProject.get('id'), protocolId);
    return this.context.router.history.push(url);
  }

  setActiveProject(project) {
    this.setState({ activeProject: project });
  }

  loadedProjects() {
    return this.props.results;
  }

  onToggleProjectStar(project) {
    const { searchOptions, totalProjects } = this.props;

    if (project && searchOptions.get('is_starred')) {    // after toggling a project, it should be removed from the store, if favorite filter is enabled.
      ProjectSearchStore.remove(project.get('id'), searchOptions.get('query'), searchOptions.get('page'));
      ProjectFiltersActions.updateState({ totalProjects: totalProjects - 1 });
    }
  }

  search(options = this.props.searchOptions) {
    this.props.actions.onSearchFilterChange(this.onSearchFailed, options);
  }

  onSearchFailed(xhr) {
    this.setState({ statusCode: xhr.status });
  }

  fetch_more() {
    this.setState({ loading: true });
    const options = this.props.searchOptions.toJS();
    const { subdomain } = this.props.match.params;
    const searchProjects = ProjectActions.search(subdomain, { ...options, page: this.nextPage() });
    const favoriteProjects = FavoriteAPI.indexAll({ filters: { favorable_type: 'Project' } });
    ajax.when(favoriteProjects, searchProjects)
      .fail((xhr) => this.setState({ statusCode: xhr.status }))
      .always(() => this.setState({ loading: false }));
  }

  globalKeyHandler(e) {
    if (e.target !== document.body) {
      return;
    }

    if (e.which === 191) {
      // /
      e.preventDefault();
      $(this.projectPageNode).find('.search input').focus();
    }
  }

  refill() {
    if (!this.nextPage()) {
      return;
    }

    const squares = $(this.projectPageNode).find('.project-square');

    const bottom_positions = squares.map((key, square) => {
      return square.getBoundingClientRect().bottom;
    });
    const bottomost_position = _.max(bottom_positions);

    const gap = 250 - 10;

    if (!this.state.loading && bottomost_position <= (innerHeight + gap)) {
      this.fetch_more();
    }
  }

  nextPage() {
    if (this.loadedProjects().size >= this.props.totalProjects) {
      return undefined;
    }

    return Math.floor(this.loadedProjects().size / ProjectsPage.per_page) + 1;
  }

  onTransfer(id) {
    const { searchOptions, totalProjects } = this.props;
    ProjectSearchStore.remove(id, searchOptions.get('query'), searchOptions.get('page'));
    ProjectFiltersActions.updateState({ totalProjects: totalProjects - 1 });
  }

  render() {
    return (
      <Page title="Projects" statusCode={this.state.statusCode}>
        <PageLayout
          theme="gray"
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.projects()}>Projects</Link>
                </Breadcrumbs>
              )}
            />
          )}
          Modals={[
            this.state.activeProject && (
              <React.Fragment>
                <ProtocolBrowserModal
                  key="probromo"
                  project={this.state.activeProject}
                  onSelectProtocol={this.onSelectProtocol}
                />
                <RunTransferModal
                  userId={this.props.userId}
                  projectId={this.state.activeProject.get('id')}
                  subdomain={this.props.match.params.subdomain}
                  key="run-transfer-modal"
                />
                <CreateOrEditProjectModal
                  key="edit-project-modal"
                  project={this.state.activeProject}
                />
                <ConfirmDeletionModal
                  key="confirm-delete-modal"
                  projectId={this.state.activeProject.get('id')}
                  onDone={() => { this.search(); }}
                />
                <ConfirmArchiveModal
                  key="confirm-archive-modal"
                  projectId={this.state.activeProject.get('id')}
                />
                <ConfirmUnarchiveModal
                  key="confirm-unarchive-modal"
                  projectId={this.state.activeProject.get('id')}
                />
                <ProjectTransferModal
                  key="project-transfer-modal"
                  selection={this.state.activeProject.get('id')}
                  onTransfer={this.onTransfer}
                />
              </React.Fragment>
            ),
            <CreateOrEditProjectModal
              key="create-project-modal"
              onSubmitDone={(projectId) => {
                this.search();
                this.context.router.history.push(Urls.project(projectId));
              }}
              isCreateModal
            />
          ]}
        >
          <TabLayout onBodyContentScroll={this.refill}>
            <TabLayoutTopbar>
              <ProjectsSearchFilters
                searchOptions={this.props.searchOptions}
                onSearchFilterChange={options => this.search(options)}
              />
            </TabLayoutTopbar>
            <div
              ref={(node) => { this.projectPageNode = node; }}
            >
              <Choose>
                <When condition={this.props.isLoaded && !this.props.isSearching}>
                  <ProjectSquares
                    projects={this.loadedProjects()}
                    searchOptions={this.props.searchOptions}
                    subdomain={this.props.match.params.subdomain}
                    setActiveProject={this.setActiveProject}
                    onCreate={() => this.search()}
                    onToggleProjectStar={this.onToggleProjectStar}
                    onUnhideProject={() => this.search()}
                  />
                </When>
                <Otherwise><Spinner /></Otherwise>
              </Choose>
            </div>
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const { totalProjects, isSearching } = ProjectPageState.get();
  const latestSearch  = ProjectSearchStore.getLatestSearch();
  const isLoaded      = latestSearch != undefined;
  const { subdomain } = props.match.params;
  const org           = OrganizationStore.findBySubdomain(subdomain);
  const orgId         = org ? org.get('id') : undefined;
  const searchOptions = Immutable.Map(ProjectFiltersActions.searchOptions());
  const results = ProjectSearchStore.getAllResults(searchOptions.get('query'))
    .filter(p => p.get('deleted_at') == undefined);
  const actions = ProjectFiltersActions;
  const userId = SessionStore.getUser('id');

  return {
    results,
    isLoaded,
    orgId,
    actions,
    searchOptions,
    totalProjects,
    isSearching,
    userId
  };
};

export default ConnectToStores(ProjectsPage, getStateFromStores);
