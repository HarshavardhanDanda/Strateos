import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import ProjectActions             from 'main/actions/ProjectActions';
import RunActions                 from 'main/actions/RunActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout }              from 'main/components/TabLayout';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import LaunchRun                  from 'main/pages/RunLaunchPage/LaunchRun';
import ProjectStore               from 'main/stores/ProjectStore';
import Urls                       from 'main/util/urls';
import ContextualCustomPropertiesConfigActions     from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore       from 'main/stores/ContextualCustomPropertyConfigStore';

import { Page, Spinner, Breadcrumbs } from '@transcriptic/amino';

class RunClonePage extends React.Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        params: PropTypes.shape({
          projectId: PropTypes.string,
          cloneId: PropTypes.string
        }).isRequired
      }).isRequired,
      project: PropTypes.instanceOf(Immutable.Map),
      customInputsConfig: PropTypes.object
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor() {
    super();

    this.state = {
      loading: true,
      data: undefined,
      error: undefined,
      statusCode: undefined
    };

    this.onBack = this.onBack.bind(this);
    this.onLoad = this.onLoad.bind(this);
  }

  componentDidMount() {
    const { projectId, cloneId } = this.props.match.params;
    ProjectActions.load(projectId);
    return RunActions.loadClone(projectId, cloneId)
      .then(this.onLoad)
      .fail(xhr => this.setState({ statusCode: xhr.status }));
  }

  componentDidUpdate(prevProps) {
    const { project } = this.props;
    if (!prevProps.project && project) {
      ContextualCustomPropertiesConfigActions.loadConfig(project.get('organization_id'), 'Run');
    }
  }

  onLoad(data) {
    this.setState({
      loading: false,
      data
    });
  }

  onBack() {
    this.context.router.history.goBack();
  }

  renderBreadcrumbsFromRunTab(subdomain, runSubtab, data) {
    const { status, title, id } = data.run;
    return (
      <Breadcrumbs>
        <Link
          to={Urls.runspage()}
        >
          {'Runs'}
        </Link>
        <Link
          to={Urls.runspage(runSubtab)}
        >
          {_.startCase(runSubtab)}
        </Link>
        <Link
          to={Urls.runspage(runSubtab, status)}
        >
          {_.startCase(status)}
        </Link>
        <Link
          to={Urls.runspage_details(id, runSubtab, status)}
        >
          {title}
        </Link>
        <span>Clone run</span>
        <span>{data.protocol.name}</span>
      </Breadcrumbs>
    );
  }

  renderBreadcrumbsFromProjectTab(project, data) {
    return (
      <Breadcrumbs>
        <Link to={Urls.projects()}>Projects</Link>
        <Link
          to={Urls.runs(project.get('id'))}
        >
          {project.get('name')}
        </Link>
        {project.get('archived_at') &&
          <span>(Archived)</span>
        }
        <span>Clone run</span>
        <span>{data.protocol.name}</span>
      </Breadcrumbs>
    );
  }

  render() {
    const { data, statusCode, loading } = this.state;
    const { project, runSubtab } = this.props;
    const { subdomain } = this.props.match.params;
    const protocolName = data && (data.protocol.display_name || data.protocol.name);
    const title        = `Cloning Run with Protocol: ${protocolName}`;

    const customProperties = data && data.custom_properties && data.custom_properties.value;

    if (!project ||  !data) return <Spinner />;

    return (
      <Page title={title} statusCode={statusCode}>
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={runSubtab ? this.renderBreadcrumbsFromRunTab(subdomain, runSubtab, data)
                : this.renderBreadcrumbsFromProjectTab(project, data)}
            />
          )}
        >
          <TabLayout>
            <Choose>
              <When condition={loading}>
                <Spinner />
              </When>
              <Otherwise>
                <div className="panel launch-run-panel">
                  <LaunchRun
                    manifest={data.protocol}
                    project={Immutable.Map(data.project)}
                    onExit={this.onBack}
                    exitDisplay="Back to Run"
                    canSetTestMode={false}
                    initialTestMode={data.run.test_mode}
                    initialPredecessorId={data.run.predecessor_id}
                    parameters={data.launch_request.raw_input}
                    customInputs={customProperties}
                    customInputsConfig={this.props.customInputsConfig}
                    runSubtab={this.props.runSubtab}
                    labId={data.launch_request.lab_id}
                  />
                </div>
              </Otherwise>
            </Choose>
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const { projectId, runSubtab } = props.match.params;

  const project = ProjectStore.getById(projectId);
  const customInputsConfig = project ? ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(project.get('organization_id'), 'Run') : undefined;

  return {
    project,
    customInputsConfig,
    runSubtab
  };
};

const ConnectedRunClonePage = ConnectToStores(RunClonePage,  getStateFromStores);

export default ConnectedRunClonePage;
