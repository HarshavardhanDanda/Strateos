import Immutable               from 'immutable';
import _                       from 'lodash';
import PropTypes               from 'prop-types';
import React                   from 'react';
import { Route, Switch, Link, NavLink } from 'react-router-dom';

import SessionStore from 'main/stores/SessionStore';
import getProjectActions from 'main/project/ProjectUIActions';
import ProjectActions       from 'main/actions/ProjectActions';
import BSLLabel             from 'main/components/bsl/BSLLabel';
import CreateOrEditProjectModal from 'main/components/CreateOrEditProjectModal';
import RunTransferModal     from 'main/components/RunTransferModal';
import ProjectStore         from 'main/stores/ProjectStore';
import ProtocolBrowserModal from 'main/project/ProtocolBrowserModal';
import ajax                 from 'main/util/ajax';
import Urls                 from 'main/util/urls';
import ConnectToStores      from 'main/containers/ConnectToStoresHOC';
import AcsControls from 'main/util/AcsControls';
import ImplementationProjectIndicator from 'main/components/ImplementationProjectIndicator';
import FeatureConstants from '@strateos/features';

import {
  ConfirmArchiveModal,
  ConfirmUnarchiveModal,
  ConfirmDeletionModal
} from 'main/pages/ProjectsPage/ProjectActionModals';
import { ProjectTransferModal } from 'main/components/TransferModal';
import { PageLayout, PageHeader } from 'main/components/PageLayout';

import {
  Breadcrumbs,
  Button,
  Page,
  TabRouter,
  Subtabs,
  Spinner
} from '@transcriptic/amino';

import RunsView from './views/RunsView';
import QueriesView from './views/QueriesView';

import './ProjectPage.scss';

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    viewId: PropTypes.oneOf(['runs', 'queries']),
    queryId: PropTypes.string
  }).isRequired
}).isRequired;

class ProjectPage extends React.Component {

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  static get propTypes() {
    return {
      project: PropTypes.instanceOf(Immutable.Map),
      match:   matchPropTypes
    };
  }

  constructor(props, context) {
    super(props, context);

    this.renderProjectPrimaryInfo = this.renderProjectPrimaryInfo.bind(this);
    this.onSelectProtocol = this.onSelectProtocol.bind(this);
    this.onUnhideProject = this.onUnhideProject.bind(this);

    this.state = {
      statusCode: undefined
    };
  }

  componentWillMount() {
    const { projectId } = this.props.match.params;

    if (window.intercomSettings) {
      window.intercomSettings.project_id = projectId;
    }

    ajax.when(
      ProjectActions.load(projectId)
    ).fail(() =>
      this.setState({
        statusCode: 400
      })
    );
  }

  componentWillUnmount() {
    if (window.intercomSettings) {
      window.intercomSettings.project_id = undefined;
    }
  }

  onSelectProtocol(protocolId) {
    const url = Urls.run_launch(this.props.project.get('id'), protocolId);
    return this.context.router.history.push(url);
  }

  onUnhideProject() {
    return this.context.router.history.push(Urls.projects());
  }

  renderBreadcrumbs(project) {
    return (
      <Breadcrumbs>
        <Link to={Urls.projects()}>Projects</Link>
        <Link
          to={Urls.runs(project.get('id'))}
        >
          {project.get('name')}
        </Link>
        <If condition={project.get('archived_at')}>
          <span className="tx-type--secondary">(archived)</span>
        </If>
      </Breadcrumbs>
    );
  }

  renderProjectPrimaryInfo(project, isImplementationProject) {
    return ([
      <BSLLabel key="bsl-label" bsl={project.get('bsl')} invert />,
      isImplementationProject && (
        <ImplementationProjectIndicator
          organizationName={project.getIn(['organization', 'name'])}
        />
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.LAUNCH_RUN) && (
        <div className="tx-inline__item tx-inline__item--xxs" key="launch-probromo">
          <Button
            type={isImplementationProject ? 'secondary' : 'primary'}
            size="small"
            id="create-new-run"
            key="create_run"
            onClick={() => ProtocolBrowserModal.launchModal()}
          >
            Launch Run
          </Button>
        </div>
      )
    ]);
  }

  render() {
    const { project, userId } = this.props;

    const projectName = (project != undefined) ? project.get('name') : this.props.match.params.projectId;
    const projectId = project ? project.get('id') : this.props.match.params.projectId;
    const basePath = `/${this.props.match.params.subdomain}/${this.props.match.params.projectId}`;

    const actions = project && getProjectActions(project, { onUnhideProject: this.onUnhideProject });
    const isImplementationProject = project && project.get('is_implementation');

    return (
      <Page title={`Project: ${projectName}`} statusCode={this.state.statusCode}>
        <Choose>
          <When condition={!project}><Spinner /></When>
          <Otherwise>
            <TabRouter
              basePath={basePath}
              defaultTabId="runs"
            >
              {
                () => {
                  return (
                    <PageLayout
                      PageHeader={(
                        <PageHeader
                          invert
                          isImplementationProject={isImplementationProject}
                          titleArea={this.renderBreadcrumbs(project)}
                          primaryInfoArea={this.renderProjectPrimaryInfo(project, isImplementationProject)}
                          actions={actions}
                          type={isImplementationProject ? 'brand' : 'primary'}
                        />
                      )}
                      Subtabs={(
                        <Subtabs>
                          <NavLink key="runs" to={Urls.runs(project.get('id'))}>
                            Runs
                          </NavLink>
                          <NavLink key="queries" to={Urls.queries(project.get('id'))}>
                            Queries
                          </NavLink>
                        </Subtabs>
                      )}
                      Modals={[
                        <ProtocolBrowserModal
                          key="probromo"
                          project={this.props.project}
                          onSelectProtocol={this.onSelectProtocol}
                        />,
                        <CreateOrEditProjectModal
                          key="edit-project-modal"
                          project={this.props.project}
                        />,
                        <RunTransferModal
                          key="run-transfer-modal"
                          userId={userId}
                          projectId={projectId}
                          subdomain={this.props.match.params.subdomain}
                        />,
                        <ConfirmDeletionModal
                          key="confirm-deletion-modal"
                          projectId={projectId}
                          onDone={() => { this.context.router.history.push(Urls.projects()); }}
                        />,
                        <ConfirmArchiveModal projectId={projectId} key="confirm-archive-modal" />,
                        <ConfirmUnarchiveModal projectId={projectId} key="confirm-unarchive-modal" />,
                        <ProjectTransferModal selection={projectId} key="project-transfer-modal" />
                      ]}
                    >
                      <Switch>
                        <Route
                          exact
                          path="/:subdomain/:projectId/runs"
                          render={({ match }) => {
                            return (
                              <RunsView
                                match={match}
                                project={this.props.project}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path="/:subdomain/:projectId/queries/:queryId?"
                          render={({ match }) => {
                            return (
                              <QueriesView
                                match={match}
                                project={this.props.project}
                              />
                            );
                          }}
                        />
                      </Switch>
                    </PageLayout>
                  );
                }
              }
            </TabRouter>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const projectId = props.match.params.projectId;
  const project   = ProjectStore.getById(projectId);
  const userId    = SessionStore.getUser('id');

  return { project, userId };
};

export default ConnectToStores(ProjectPage, getStateFromStores);
