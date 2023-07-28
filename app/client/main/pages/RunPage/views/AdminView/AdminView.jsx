import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import RunActions                    from 'main/actions/RunActions';
import WarpEventActions              from 'main/actions/WarpEventActions';
import InstructionsAPI               from 'main/api/InstructionAPI';
import RefAPI                        from 'main/api/RefAPI';
import PriceTree                     from 'main/components/PriceTree';
import { TabLayout }                 from 'main/components/TabLayout';
import ConnectToStores               from 'main/containers/ConnectToStoresHOC';
import assembleFullJSON              from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON } from 'main/helpers/RunPage/loadStatus';

import { PageLoading, Section } from '@transcriptic/amino';

// Stores
import RunStore from 'main/stores/RunStore';
import InstructionStore from 'main/stores/InstructionStore';
import RefStore from 'main/stores/RefStore';
import WarpEventStore from 'main/stores/WarpEventStore';

import Timing from './Timing';
import WarpEventErrors from './WarpEventErrors';

class AdminView extends React.Component {
  constructor() {
    super();

    this.state = {
      statusCode: undefined
    };

    this.instructionsQueryLimit = 30;
  }

  componentWillMount() {
    const { match, run, warpEventErrors } = this.props;
    const { projectId, runId } = match.params;
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);

    this.fetchAndSaveData({
      shouldFetchRun: !runLoaded,
      shouldFetchInstructions: !instructionsLoaded,
      shouldFetchRefs: !refsLoaded
    });

    if (warpEventErrors.count() === 0) {
      WarpEventActions.warpEventErrorsForRun(projectId, runId);
    }
  }

  onStatusCodeChange(newStatusCode) {
    this.setState({ statusCode: newStatusCode });
  }

  fetchAndSaveData({ shouldFetchRun, shouldFetchInstructions, shouldFetchRefs }) {
    if (shouldFetchRefs) this.fetchRefs();
    if (shouldFetchRun) this.fetchRun();
    if (shouldFetchInstructions) this.fetchInstructions();
  }

  fetchRun() {
    const { runId, projectId } = this.props.match.params;

    return RunActions.loadMinimal(projectId, runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchInstructions() {
    const { runId } = this.props.match.params;

    return InstructionsAPI.fetchAllForRun(runId, this.instructionsQueryLimit)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchRefs() {
    const { runId } = this.props.match.params;

    return RefAPI.fetchWithContainersOmcs(runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  render() {
    const { run, warpEventErrors } = this.props;
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);

    let tree;
    if (run && run.getIn && run.getIn(['quote', 'breakdown']) && run.getIn(['quote', 'breakdown']).toJS) {
      tree = run.getIn(['quote', 'breakdown']).toJS();
    }

    if (!runLoaded || !(instructionsLoaded && refsLoaded)) {
      return <PageLoading />;
    }

    return (
      <TabLayout>
        <div className="section">
          <h3 className="section-title">Timing summary</h3>
          <p>(Excluding gantry time between devices)</p>
          <Timing run={run} />
        </div>

        <div className="section">
          <h3 className="section-title">Pricing breakdown</h3>
          <Choose>
            <When condition={tree}>
              <PriceTree node={tree} />
            </When>
            <Otherwise>
              <div className="empty">
                No pricing breakdown available
              </div>
            </Otherwise>
          </Choose>
        </div>
        <Section title="Error summary">
          <WarpEventErrors
            run={run}
            warpEventErrors={warpEventErrors}
          />
        </Section>
      </TabLayout>
    );
  }
}

AdminView.propTypes = {
  run: PropTypes.object,
  match: PropTypes.object,
  warpEventErrors: PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = (props) => {
  const { runId } = props.match.params;

  const run = RunStore.getById(runId);
  const refs = RefStore.getByRunId(runId).toList();
  const instructions = InstructionStore.getByRunId(runId).toList();
  const warpEventErrors = WarpEventStore.getAllByWarpStateAndRunId(runId, 'Failed');

  let fullJSON;

  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run, instructions, refs });
  }

  return { run: fullJSON, warpEventErrors };
};

const ConnectedAdminView = ConnectToStores(AdminView, getStateFromStores);

ConnectedAdminView.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  warpEventErrors: PropTypes.instanceOf(Immutable.Iterable)
};

export default ConnectedAdminView;
