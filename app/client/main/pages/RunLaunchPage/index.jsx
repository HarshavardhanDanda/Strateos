import Immutable   from 'immutable';
import PropTypes   from 'prop-types';
import React       from 'react';
import { Link }    from 'react-router-dom';
import Querystring from 'query-string';

import ProjectActions             from 'main/actions/ProjectActions';
import ProtocolActions            from 'main/actions/ProtocolActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout }              from 'main/components/TabLayout';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import ProtocolBrowserModal       from 'main/project/ProtocolBrowserModal';
import ProjectStore               from 'main/stores/ProjectStore';
import ProtocolStore              from 'main/stores/ProtocolStore';
import Urls                       from 'main/util/urls';
import LaunchRequestAPI           from 'main/api/LaunchRequestAPI';
import ContextualCustomPropertiesConfigActions     from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore       from 'main/stores/ContextualCustomPropertyConfigStore';
import SessionStore from 'main/stores/SessionStore';
import ImplementationProjectIndicator from 'main/components/ImplementationProjectIndicator';

import { Page, Breadcrumbs, Spinner } from '@transcriptic/amino';

import LaunchRun from './LaunchRun';

import './RunLaunchPage.scss';

class RunLaunchPage extends React.Component {
  static get propTypes() {
    return {
      protocolId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      protocol: PropTypes.instanceOf(Immutable.Map),
      project: PropTypes.instanceOf(Immutable.Map),
      customInputsConfig: PropTypes.object
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    this.fetch();
  }

  // Returns the launch request id if it exists in the url
  launchRequestId() {
    const qs = this.props.location.search.substr(1);
    const launchId = Querystring.parse(qs).launch_request_id;
    return launchId;
  }

  fetch() {
    const { protocolId, projectId } = this.props;
    ProtocolActions.load(protocolId);
    ProjectActions.load(projectId);
    ContextualCustomPropertiesConfigActions.loadConfig(SessionStore.getOrg().get('id'), 'Run');
    const launchId = this.launchRequestId();
    if (launchId) {
      const promise = LaunchRequestAPI.get(launchId);
      promise.then((res) => {
        const launchRequest = res.data.attributes;
        if (launchRequest.protocol_id != protocolId) return alert('The launch request id did not match the protocol you are launching.');
        this.setState({ launchRequest });
      });
      promise.fail(() => {
        alert(`Could not find LaunchRequest for id: ${launchId}`);
      });
    }
  }

  render() {
    const { protocol, project, projectId, customInputsConfig } = this.props;
    const launchId = this.launchRequestId();
    const waitingForLaunchRequest = launchId && !this.state.launchRequest;

    if (!protocol || !project || waitingForLaunchRequest) return <Spinner />;

    const onSelectProtocol = (selectedProtocolId) => {
      const url = Urls.run_launch(projectId, selectedProtocolId);
      this.context.router.history.push(url);
    };

    const protocolName = protocol.get('display_name') || protocol.get('name');
    const title        = `Launching protocol: ${protocolName}`;
    const isImplementationProject = project.get('is_implementation');

    return (
      <Page title={title}>
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.projects()}>Projects</Link>
                  <Link
                    to={Urls.runs(project.get('id'))}
                  >
                    {project.get('name')}
                  </Link>
                  <If condition={project.get('archived_at')}>
                    <span className="breadcrumbs__item-link--invert tx-type--secondary">(archived)</span>
                  </If>
                  <span>Launch Run</span>
                  <span>{protocol.get('name')}</span>
                </Breadcrumbs>
              )}
              primaryInfoArea={(
                isImplementationProject && (
                  <ImplementationProjectIndicator
                    organizationName={project.getIn(['organization', 'name'])}
                  />
                )
              )}
              type={isImplementationProject ? 'brand' : 'primary'}
            />
          )}
        >
          <TabLayout>
            <div className="panel launch-run-panel">
              <LaunchRun
                manifest={protocol.toJS()}
                project={project}
                onExit={ProtocolBrowserModal.launchModal}
                exitDisplay="View Protocols"
                initialTestMode={this.state.launchRequest ? this.state.launchRequest.test_mode : false}
                canSetTestMode={!this.state.launchRequest}
                parameters={this.state.launchRequest ? this.state.launchRequest.raw_input : undefined}
                customInputsConfig={customInputsConfig}
              />
              <ProtocolBrowserModal
                project={project}
                onSelectProtocol={id => onSelectProtocol(id)}
              />
            </div>
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const { protocolId, projectId } = props.match.params;

  const protocol = ProtocolStore.getById(protocolId);
  const project = ProjectStore.getById(projectId);
  const customInputsConfig = project && ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(project.get('organization_id'), 'Run');
  return {
    protocolId,
    projectId,
    protocol,
    project,
    customInputsConfig
  };
};

const ConnectedRunLaunchPage = ConnectToStores(RunLaunchPage,  getStateFromStores);

ConnectedRunLaunchPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      protocolId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default ConnectedRunLaunchPage;
