import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import RunActions                      from 'main/actions/RunActions';
import InstructionsAPI                 from 'main/api/InstructionAPI';
import RefAPI                          from 'main/api/RefAPI';
import { RunRefContainer }             from 'main/components/RunRef';
import { TabLayout, TabLayoutSidebar } from 'main/components/TabLayout';
import ConnectToStores                 from 'main/containers/ConnectToStoresHOC';
import assembleFullJSON                from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON }   from 'main/helpers/RunPage/loadStatus';
import orderedInstructionsWithRefNames from 'main/helpers/RunPage/orderedInstructionsWithRefNames';
import RunStore                        from 'main/stores/RunStore';
import Urls                            from 'main/util/urls';

import { VerticalNavBar, TabRouter, Spinner, PageLoading, ZeroState } from '@transcriptic/amino';

// Stores
import InstructionStore from 'main/stores/InstructionStore';
import RefStore from 'main/stores/RefStore';

import './ContainersView.scss';
import ConnectedGeneratedContainer from 'main/components/RunRef/GeneratedContainer';

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    runId: PropTypes.string.isRequired,
    refName: PropTypes.string
  }).isRequired
}).isRequired;

class ContainersView extends React.Component {
  constructor() {
    super();

    this.state = {
      statusCode: undefined,
      emptyState: false
    };

    _.bindAll(
      this,
      'getRefByName',
      'sortedRefs',
      'renderEmpty'
    );

    this.instructionsQueryLimit = 30;
  }

  componentWillMount() {
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(this.props.run);

    this.fetchAndSaveData({
      shouldFetchRun: !runLoaded,
      shouldFetchInstructions: !instructionsLoaded,
      shouldFetchRefs: !refsLoaded
    });
  }

  onStatusCodeChange(newStatusCode) {
    this.setState({ statusCode: newStatusCode });
  }

  getRefByName(refName) {
    const { run } = this.props;
    const { runLoaded, refsLoaded } = loadStatus(run);

    if (!runLoaded || !refsLoaded) return undefined;

    return run.get('refs').find(ref => ref.get('name') === refName);
  }

  fetchAndSaveData({ shouldFetchRun, shouldFetchInstructions, shouldFetchRefs }) {
    if (shouldFetchRefs) this.fetchRefs();
    if (shouldFetchRun) this.fetchRun();
    if (shouldFetchInstructions) this.fetchInstructions();
  }

  fetchRun() {
    const { runId } = this.props.match.params;
    const { projectId } = this.props;

    return RunActions.loadMinimal(projectId, runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchInstructions() {
    const { runId } = this.props.match.params;

    return InstructionsAPI.fetchAllForRun(runId, this.instructionsQueryLimit)
      .then((res) => {
        if (_.isEmpty(res)) return this.setState({ emptyState: true });
      })
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchRefs() {
    const { runId } = this.props.match.params;

    return RefAPI.fetchWithContainersOmcs(runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  sortedRefs(refs) {
    return refs.sortBy(ref => ref.get('name'));
  }

  sortedContainers(containers) {
    return containers.sortBy(container => container.get('label') || container.get('id'));
  }

  getGeneratedContainers(instructions) {
    let containers = Immutable.List([]);

    if (instructions && instructions.size > 0) {
      instructions.forEach(instruction => {
        const gContainers = instruction.get('generated_containers');
        if (gContainers && gContainers.size > 0) {
          containers = containers.concat(gContainers);
        }
      });
    }

    return containers;
  }

  showRefs() {
    return this.props.match.url.includes('refs');
  }

  renderEmpty() {
    return (
      <div className="results">
        <h3>
          <i className="fa fa-life-ring" />
          Nothing to see here.
        </h3>
        <p>There aren&#39;t any containers associated with this run.</p>
      </div>
    );
  }

  render() {
    const { run, projectId } = this.props;
    const { subdomain, runId, runView, runStatus } = this.props.match.params;
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);

    if (run && run.get('refs') && (run.get('refs').count() === 0)) {
      return (
        this.renderEmpty()
      );
    }

    if (!runLoaded || !refsLoaded) {
      return this.state.emptyState ? <ZeroState  title="No records found" /> : <PageLoading />;
    }

    const currentTab = this.showRefs() ? 'refs' : 'generated_containers';
    const basePath  =  `/${subdomain}${runView ? `/runspage/${runView}/${runStatus}` : `/${projectId}`}/runs/${runId}/${currentTab}`;
    const firstName = this.sortedRefs(run.get('refs')).first().get('name');
    const containers = this.getGeneratedContainers(run.get('instructions'));

    return (
      <TabRouter
        basePath={basePath}
        defaultTabId={decodeURI(encodeURIComponent(firstName))}
      >
        {
          (refName) => {
            return (
              <TabLayout>
                <TabLayoutSidebar>
                  <div className="navbar-container">
                    <VerticalNavBar
                      header="Used In Run"
                      links={this.sortedRefs(run.get('refs')).map((ref) => {
                        return {
                          name: ref.get('name'),
                          url: runView ? Urls.runspage_ref(runId, ref.get('name'), runView, runStatus)
                            : Urls.run_ref(projectId, runId, ref.get('name'))
                        };
                      })}
                    />
                  </div>
                  <If condition={containers.size > 0}>
                    <div className="navbar-container">
                      <VerticalNavBar
                        header="Generated Containers"
                        links={this.sortedContainers(containers).map((container) => {
                          const name = container.get('label') || container.get('id');
                          return {
                            name: name,
                            url: runView ? Urls.runspage_generated_container(runId, container.get('id'), runView, runStatus)
                              : Urls.run_generated_container(projectId, runId, container.get('id'))
                          };
                        })}
                      />
                    </div>
                  </If>
                </TabLayoutSidebar>

                <Choose>
                  <When condition={refName && instructionsLoaded && this.showRefs()}>
                    <RunRefContainer
                      runView={runView}
                      runStatus={runStatus}
                      runRef={this.getRefByName(decodeURIComponent(refName))}
                      run={run}
                    />
                  </When>
                  <When condition={refName && instructionsLoaded}>
                    <ConnectedGeneratedContainer
                      containerId={decodeURIComponent(refName)}
                    />
                  </When>
                  <Otherwise>
                    <Spinner />
                  </Otherwise>
                </Choose>
              </TabLayout>
            );
          }
        }
      </TabRouter>
    );

  }
}

ContainersView.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  match: matchPropTypes
};

const getStateFromStores = (props) => {
  const { runId } = props.match.params;

  const run = RunStore.getById(runId);
  const refs = RefStore.getByRunId(runId).toList();
  const instructions = orderedInstructionsWithRefNames(
    InstructionStore.getByRunId(runId), refs
  );
  const projectId = props.match.params.projectId || (run && run.get('project_id'));

  let fullJSON;

  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run, instructions, refs });
  }

  return { run: fullJSON, projectId };
};

const ConnectedContainersView = ConnectToStores(ContainersView, getStateFromStores);

ConnectedContainersView.PropTypes = {
  match: matchPropTypes
};

export default ConnectedContainersView;
