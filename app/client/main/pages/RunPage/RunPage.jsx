import Immutable from 'immutable';
import AuthorizeHOC from 'main/containers/AuthorizeHOC';
import PropTypes from 'prop-types';
import React from 'react';
import { Route, Switch, NavLink } from 'react-router-dom';

import {
  Page,
  Subtabs,
  TabRouter,
  Spinner
} from '@transcriptic/amino';

import CreateOrEditProjectModal from 'main/components/CreateOrEditProjectModal';
import { PageLayout } from 'main/components/PageLayout';
import RunFeedbackModal from 'main/components/RunFeedbackModal';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ProtocolBrowserModal from 'main/project/ProtocolBrowserModal';
import ProjectStore from 'main/stores/ProjectStore';
import RunStore from 'main/stores/RunStore';
import SessionStore from 'main/stores/SessionStore';

import Urls from 'main/util/urls';

import FeatureConstants from '@strateos/features';

import RunActions from 'main/actions/RunActions';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import ViewActivityLogModal from './modals/ViewActivityLogModal.jsx';
import UploadFileModal from './modals/UploadFileModal.jsx';
import DownloadFileModal from './modals/DownloadFileModal.jsx';
import ExecutionModal from './modals/ExecutionModal';
import ParametersModal from './modals/ParametersModal';
import RunSettingsModal from './modals/RunSettingsModal';
import DeleteDataModal from './modals/DeleteDataModal';
import AdminView from './views/AdminView';
import ContainersView from './views/ContainersView';
import InstructionsView from './views/InstructionsView';
import QuoteView from './views/QuoteView';
import ResultsView from './views/ResultsView';
import SupportView from './views/SupportView';
import TaskGraphView from './views/TaskGraphView';
import RelatedRunsView from './views/RelatedRunsView';
import RunCustomPropertiesView from './views/RunCustomPropertiesView';

import Header from './components/Header';
import ACSControls from '../../util/AcsControls';

const AuthorizedAdminView = AuthorizeHOC(
  AdminView,
  () => SessionStore.isAdmin()
);

const AuthorizedInstructionsView = AuthorizeHOC(
  InstructionsView,
  () => SessionStore.isAdmin()
);

const AuthorizedQuoteView = AuthorizeHOC(
  QuoteView,
  () => ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)
     || ACSControls.isFeatureEnabled(FeatureConstants.VIEW_PROJECTS_RUNS)
);

class RunPage extends React.Component {

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onSelectProtocol = this.onSelectProtocol.bind(this);

    this.state = {
      statusCode: undefined,
      reactionId: undefined
    };
  }

  async componentDidMount() {
    const { projectId, runId } = this.props.match.params;
    const { project } = this.props;

    if (window.intercomSettings) {
      window.intercomSettings.run_id = runId;
    }
    this.fetch(projectId, runId);
    if (project) {
      ContextualCustomPropertiesConfigActions.loadConfig(project.get('organization_id'), 'Run');
    }
  }

  componentDidUpdate(prevProps) {
    const { project } = this.props;
    const  { projectId, runId } = this.props.match.params;

    const oldRunId = prevProps.match.params.runId;
    const oldProject  = prevProps.project;

    if (oldRunId !== runId) {
      this.fetch(projectId, runId);
    }

    if (!oldProject && project) {
      ContextualCustomPropertiesConfigActions.loadConfig(project.get('organization_id') || SessionStore.getOrg().get('id'), 'Run');
    }
  }

  componentWillUnmount() {
    if (window.intercomSettings) {
      window.intercomSettings.run_id = undefined;
    }
  }

  onSelectProtocol(protocolId) {
    const url = Urls.run_launch(this.props.project.get('id'), protocolId);
    return this.context.router.history.push(url);
  }

  fetch(projectId, runId) {
    let includes = 'owner,project';
    let json_type = null;
    if (this.props.match.params.runView) {
      includes = 'project';
      json_type = 'minimal_json';
    }
    this.getReactionId(runId);
    RunActions.loadRunListById(runId, includes, json_type);
  }

  evaluateBasePath() {
    var { runView, runStatus, subdomain, projectId, runId } = this.props.match.params;
    return (`/${subdomain}${runView ? `/runspage/${runView}/${runStatus}` : `/${projectId}`}/runs/${runId}`);
  }

  evaluateRoutes(tabId) {
    return this.props.match.params.runView ? `/:subdomain/runspage/:runView/:runStatus/runs/:runId/${tabId}` :
      `/:subdomain/:projectId/runs/:runId/${tabId}`;
  }

  getReactionId(id) {
    ReactionAPI.getReactions(id)
      .then(
        (res) => {
          this.setState({ reactionId: res[0] && res[0].id });
        }
      );
  }

  render() {
    var { runView, runStatus } = this.props.match.params;
    const { project, run, owner, isLoading, history, customInputsConfig } = this.props;
    const runName = (run != undefined && run.get('title')) ? run.get('title') : this.props.match.params.runId;
    const url = this.props.match.url;

    return (
      <Page title={!isLoading ? `Run: ${runName}` : 'Loading Run...'} statusCode={this.state.statusCode}>
        <Choose>
          <When condition={isLoading}>
            <Spinner />
          </When>
          <Otherwise>
            <TabRouter
              basePath={this.evaluateBasePath()}
              defaultTabId="instructions"
            >
              {
                () => {
                  return (
                    <PageLayout
                      PageHeader={(
                        <Header
                          history={history}
                          runView={runView}
                          runStatus={runStatus}
                          project={project}
                          run={run}
                          owner={owner}
                          reactionId={this.state.reactionId}
                        />
                      )}
                      Subtabs={(
                        <Subtabs>
                          <NavLink
                            key="instructions"
                            to={runView ? Urls.runspage_instructions(run.get('id'), runView, runStatus) :
                              Urls.run_instructions(project.get('id'), run.get('id'))}
                          >
                            Instructions
                          </NavLink>
                          <NavLink
                            key="related-runs"
                            to={runView ? Urls.runspage_related_runs(run.get('id'), runView, runStatus) :
                              Urls.run_related_runs(project.get('id'), run.get('id'))}
                          >
                            Related runs
                          </NavLink>
                          <NavLink
                            key="graph"
                            to={runView ? Urls.runspage_graph(run.get('id'), runView, runStatus) :
                              Urls.run_graph(project.get('id'), run.get('id'))}
                          >
                            Graph
                          </NavLink>
                          <NavLink
                            key="containers"
                            to={runView ? Urls.runspage_refs(run.get('id'), runView, runStatus) :
                              Urls.run_refs(project.get('id'), run.get('id'))}
                            isActive={() => ['/refs', '/generated_containers'].some((path) => url.includes(path))}
                          >
                            Containers
                          </NavLink>
                          <NavLink
                            key="results"
                            to={runView ? Urls.runspage_data(run.get('id'), runView, runStatus) :
                              Urls.run_data(project.get('id'), run.get('id'))}
                          >
                            Results
                          </NavLink>
                          <If condition={ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)
                            || ACSControls.isFeatureEnabled(FeatureConstants.VIEW_PROJECTS_RUNS)}
                          >
                            <NavLink
                              key="quote"
                              to={runView ? Urls.runspage_quote(run.get('id'), runView, runStatus) :
                                Urls.run_quote(project.get('id'), run.get('id'))}
                            >
                              Quote
                            </NavLink>
                          </If>
                          <If condition={ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)
                            || ACSControls.isFeatureEnabled(FeatureConstants.SUBMIT_SUPPORT_TICKET)}
                          >
                            <NavLink
                              key="support"
                              to={runView ? Urls.runspage_support(run.get('id'), runView, runStatus) :
                                Urls.run_support(project.get('id'), run.get('id'))}
                            >
                              Support
                            </NavLink>
                          </If>
                          {customInputsConfig && (
                            <NavLink
                              key="properties"
                              to={runView ? Urls.runspage_properties(run.get('id'), runView, runStatus) :
                                Urls.run_properties(project.get('id'), run.get('id'))}
                            >
                              Properties
                            </NavLink>
                          )}
                          <If condition={SessionStore.isAdmin()}>
                            <NavLink
                              key="tx-admin"
                              to={runView ? Urls.runspage_admin(run.get('id'), runView, runStatus) :
                                Urls.run_admin(project.get('id'), run.get('id'))}
                            >
                              Tx-admin
                            </NavLink>
                          </If>
                        </Subtabs>
                      )}
                      Modals={[
                        <ViewActivityLogModal
                          key="view-activity-log-modal"
                          runId={this.props.run.get('id')}
                        />,
                        <UploadFileModal
                          key="upload-file-modal"
                          runId={this.props.run.get('id')}
                          run={run}
                        />,
                        <DeleteDataModal
                          key="delete-data-modal"
                          run={run}
                        />,
                        <DownloadFileModal
                          key="download-file-modal"
                          runId={this.props.run.get('id')}
                          run={run}
                        />,
                        <ProtocolBrowserModal
                          key="probromo"
                          project={this.props.project}
                          onSelectProtocol={this.onSelectProtocol}
                        />,
                        <RunFeedbackModal
                          key="run-feedback-modal"
                          success={this.props.run.get('success')}
                          successNotes={this.props.run.get('success_notes')}
                          projectId={this.props.project.get('id')}
                          runId={this.props.run.get('id')}
                        />,
                        <RunSettingsModal
                          key="run-settings-modal"
                          projectId={this.props.project.get('id')}
                          runId={this.props.run.get('id')}
                          runTitle={this.props.run.get('title')}
                          organizationId={this.props.run.get('organization_id')}
                          labId={this.props.run.get('lab_id')}
                        />,
                        <CreateOrEditProjectModal key="project-settings-modal" project={this.props.project} />,
                        <ExecutionModal key="execution-modal" run={run} />,
                        <ParametersModal key="parameters-modal" run={run} />
                      ]}
                    >
                      <Switch>
                        <Route
                          exact
                          path={this.evaluateRoutes('instructions')}
                          render={({ match }) => {
                            return (
                              <InstructionsView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={this.evaluateRoutes('related_runs')}
                          render={({ match }) => {
                            return (
                              <RelatedRunsView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={this.evaluateRoutes('graph')}
                          render={({ match }) => {
                            return (
                              <TaskGraphView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={`${this.evaluateRoutes('refs')}/:refName?`}
                          render={({ match }) => {
                            return (
                              <ContainersView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={`${this.evaluateRoutes('generated_containers')}/:containerId?`}
                          render={({ match }) => {
                            return (
                              <ContainersView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={`${this.evaluateRoutes('data/analysis')}/:dataRef?`}
                          render={({ match }) => {
                            return (
                              <ResultsView
                                match={match}
                                isAnalysis
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={`${this.evaluateRoutes('data')}/:dataRef?`}
                          render={({ match }) => {
                            return (
                              <ResultsView
                                match={match}
                              />
                            );
                          }}
                        />
                        <Route
                          exact
                          path={this.evaluateRoutes('quote')}
                          render={({ match }) => {
                            return <AuthorizedQuoteView match={match} />;
                          }}
                        />
                        <If condition={ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)
                          || ACSControls.isFeatureEnabled(FeatureConstants.SUBMIT_SUPPORT_TICKET)}
                        >
                          <Route
                            exact
                            path={this.evaluateRoutes('support')}
                            render={({ match }) => {
                              return (
                                <SupportView
                                  match={match}
                                />
                              );
                            }}
                          />
                        </If>
                        { customInputsConfig && (
                        <Route
                          exact
                          path={this.evaluateRoutes('properties')}
                          render={({ match }) => {
                            return (
                              <RunCustomPropertiesView match={match} customInputsConfig={customInputsConfig} />
                            );
                          }}
                        />
                        )}
                        <If condition={ACSControls.isFeatureEnabled(FeatureConstants.INCLUDE_TX_ADMIN_IN_RUN_DETAIL)}>
                          <Route
                            exact
                            path={this.evaluateRoutes('admin')}
                            render={
                              ({ match }) => {
                                return (
                                  <AuthorizedAdminView match={match} />
                                );
                              }
                            }
                          />
                        </If>
                        <Route
                          exact
                          path={this.evaluateRoutes(':instructionId')}
                          render={({ match }) => {
                            return (
                              <AuthorizedInstructionsView
                                match={match}
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

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    runId: PropTypes.string.isRequired,
    viewId: PropTypes.oneOf(['instructions', 'related_runs', 'graph', 'refs', 'data', 'quote', 'support', 'admin']),
    runView: PropTypes.oneOf(['approvals', 'queue']),
    runStatus: PropTypes.oneOf(['all_runs', 'aborted', 'accepted', 'complete', 'in_progress'])
  }).isRequired
}).isRequired;

RunPage.propTypes = {
  project: PropTypes.instanceOf(Immutable.Map),
  run: PropTypes.instanceOf(Immutable.Map),
  owner: PropTypes.instanceOf(Immutable.Map),
  match:   matchPropTypes,
  isLoading: PropTypes.bool,
  customInputsConfig: PropTypes.object
};

const getStateFromStores = (props) => {
  const runId = props.match.params.runId;
  const run = RunStore.getById(runId);
  const projectId = props.match.params.projectId || (run && run.get('project_id'));
  const project  = ProjectStore.getById(projectId);

  const customInputsConfig = project && ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(project.get('organization_id'), 'Run');
  const owner = run && run.get('owner');
  // HACK: Check for existence of project in run as proxy for full run being loaded.
  // There is an inconsistency between RunActions and RunAPI. If page A loads a run using RunAPI, it very
  // likely specifies a subset of the total run properties. This subset may not match the subset needed in page B. If
  // the user navigates to Page B from Page A through a React Router link - Page B may simply check if a run exists in
  // the store - assuming it was fetched with RunActions and thus has all the properties. A better approach to loading
  // is needed to address this until all data fetching can be moved to JSON API. This is noted in T13141
  return { project, run, owner, isLoading: !project || !run, customInputsConfig };
};

export default ConnectToStores(RunPage, getStateFromStores);
