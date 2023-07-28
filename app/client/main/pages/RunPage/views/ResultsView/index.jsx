import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import RunActions       from 'main/actions/RunActions';
import InstructionsAPI  from 'main/api/InstructionAPI';
import RefAPI           from 'main/api/RefAPI';
import DatasetStore     from 'main/stores/DatasetStore';
import InstructionStore from 'main/stores/InstructionStore';
import RefStore         from 'main/stores/RefStore';
import RunStore         from 'main/stores/RunStore';

import { TabLayout, TabLayoutSidebar } from 'main/components/TabLayout';
import ConnectToStores                 from 'main/containers/ConnectToStoresHOC';
import assembleFullJSON                from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON }   from 'main/helpers/RunPage/loadStatus';
import orderedInstructionsWithRefNames from 'main/helpers/RunPage/orderedInstructionsWithRefNames';

import { ZeroState, TabRouter, Button, PageLoading } from '@transcriptic/amino';

import ResultsViewSidebar from './ResultsViewSidebar';
import ResultsViewContent from './ResultsViewContent';

import './index.scss';

class ResultsView extends React.Component {

  static get propTypes() {
    return {
      runId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      subdomain: PropTypes.string.isRequired,
      run: PropTypes.instanceOf(Immutable.Map),
      datasets: PropTypes.instanceOf(Immutable.Iterable),
      isAnalysis: PropTypes.bool,
      history: PropTypes.object // eslint-disable-line react/no-unused-prop-types
    };
  }

  constructor(props) {
    super(props);

    const { instructionsLoaded } = loadStatus(props.run);

    this.state = {
      statusCode: undefined,

      // allInstructionsFetched is required to prevent premature zero state component render
      allInstructionsFetched: instructionsLoaded === true,
      emptyState: false,
      selectedPanel: '',
    };

    this.instructionsQueryLimit = 30;
  }

  componentDidMount() {
    const { run } = this.props;
    const { runLoaded, refsLoaded, instructionsLoaded } = loadStatus(run);

    this.fetchAndSaveData({
      shouldFetchRun: !runLoaded,
      shouldFetchInstructions: !instructionsLoaded,
      shouldFetchRefs: !refsLoaded
    });
  }

  fetchAndSaveData({ shouldFetchRun, shouldFetchInstructions, shouldFetchRefs }) {
    const { runId, projectId } = this.props;

    if (shouldFetchRefs) {
      RefAPI.fetchWithContainersOmcs(runId)
        .then((res) => {
          if (res[0].meta.record_count === 0) return this.setState({ emptyState: true });
        })
        .fail(err => this.setState({ statusCode: err.status }));
    }

    if (shouldFetchRun) {
      RunActions.loadMinimal(projectId, runId)
        .fail(err => this.setState({ statusCode: err.status }));
    }

    if (shouldFetchInstructions) {
      InstructionsAPI.fetchAllForRun(runId, this.instructionsQueryLimit)
        .done(() => this.setState({ allInstructionsFetched: true }))
        .fail(err => this.setState({ statusCode: err.status }));
    }
  }

  getDefaultDataRefId() {
    const { run } = this.props;

    const datarefs = run.get('instructions')
      .map(i => i.getIn(['operation', 'dataref']))
      .filter(dataref => dataref != undefined);

    return datarefs.get(0);
  }

  getDefaultAnalysisId() {
    const datasets = this.getSortedDatasets();

    const analyses = datasets.filter(d => d.get('is_analysis'));

    return analyses.first() && analyses.first().get('id');
  }

  // A map from id to dataset.
  // Will include both analysis and measurement datasets.
  getDatasetsById() {
    const datasets = this.getSortedDatasets();

    const result = {};

    datasets.forEach((dataset) => {
      result[dataset.get('id')] = dataset;
    });

    return result;
  }

  // A map from refname to dataset.
  // Only Measurement datasets have refnames
  getDatasetsByRefname() {
    const { run } = this.props;

    const datasets = this.getSortedDatasets();
    const instructions  = run.get('instructions');
    const instToDataset = datasets.map(d => [d.get('instruction_id'), d]).fromEntrySeq().toMap();
    const result = {};

    instructions.forEach((instruction) => {
      const dataref = instruction.getIn(['operation', 'dataref']);
      if (dataref !== undefined) {
        const dataset = instToDataset.get(instruction.get('id'));
        result[dataref] = dataset ? dataset.set('completed_at', instruction.get('completed_at')) : dataset;
      }
    });

    return result;
  }

  getSortedDatasets() {
    const { run } = this.props;
    return run.get('datasets');
  }

  renderContent(noMeasurements, noAnalysis, datarefOrId, dataset, run) {
    if (noMeasurements || noAnalysis) {
      return (
        <div className="result-view__content">
          <ZeroState
            title={`You do not have any ${noMeasurements ? 'measurements' : 'analysis'} to view at this time.`}
            subTitle={noMeasurements ? 'We will notify you when data summary is generated' : null}
            zeroStateSvg="/images/projects-illustration.svg"
          />
        </div>
      );
    }

    if (dataset === undefined) {
      return (
        <div className="result-view__content">
          <ZeroState
            title="Pending data collection"
            subTitle="When the instruction behind this dataref executes, your results will be available here."
            zeroStateSvg="/images/projects-illustration.svg"
          />
        </div>
      );
    }

    return (
      <ResultsViewContent
        name={datarefOrId}
        dataset={dataset}
        run={run}
      />
    );
  }

  render() {
    const { subdomain, runId, projectId, run, runView, runStatus } = this.props;
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);
    const { allInstructionsFetched, emptyState } = this.state;
    if (!runLoaded || !(refsLoaded && instructionsLoaded && allInstructionsFetched)) {
      return emptyState ? <ZeroState  title="No records found" /> : <PageLoading />;
    }

    const datasets = this.getSortedDatasets();
    const datasetsByRefname = this.getDatasetsByRefname();
    const datasetsById      = this.getDatasetsById();
    const datasetCount      = datasetsByRefname.size;

    const measurements = datasets.filter(dataset => !dataset.get('is_analysis'));
    const analyses = datasets.filter(dataset => {
      return dataset.get('is_analysis');
    });
    const noMeasurements = this.state.selectedPanel === 'measurements' && measurements.size === 0;
    const noAnalysis = this.state.selectedPanel === 'analyses' && analyses.size === 0;

    // Zero State if no datasets
    if (datasetCount == 0) {
      return (
        <ZeroState
          title="This run does not produce datasets."
          subTitle="To generate data you must specify datarefs in your Autoprotocol."
          button={(
            <a
              href="http://autoprotocol.org/specification/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="primary" size="large">
                View Autoprotocol Docs
              </Button>
            </a>
          )}
        />
      );
    }

    const defaultDataRefId   = this.getDefaultDataRefId();
    const defaultAnalysisId  = this.getDefaultAnalysisId();
    const shouldShowAnalysis = this.props.isAnalysis || (!defaultDataRefId && defaultAnalysisId);

    // Base path needs a suffix of analysis if it is explicitly an analysis URL, or if
    // there is a default analysis id and not a dataref one.
    let basePath = `/${subdomain}${runView ? `/runspage/${runView}/${runStatus}` : `/${projectId}`}/runs/${runId}/data`;
    if (shouldShowAnalysis) {
      basePath += '/analysis';
    }

    const sanitizedRefId = decodeURI(encodeURIComponent(defaultDataRefId));

    return (
      <TabRouter
        basePath={basePath}
        defaultTabId={shouldShowAnalysis ? defaultAnalysisId : sanitizedRefId}
      >
        {
          (datarefOrIdFromRouter) => {
            const datarefOrId = decodeURIComponent(datarefOrIdFromRouter);
            let dataset = datasetsByRefname[datarefOrId] || datasetsById[datarefOrId];

            // HACK
            // Assume the DatasetStore has the freshest copy since the run with the nested dataset never updates
            // Views below depend on state changes on the dataset
            if (dataset) {
              const latestDataset = this.props.datasets.find(d => d.get('id') == dataset.get('id'));
              dataset = latestDataset || dataset;
            }

            return (
              <TabLayout wideSidebar>
                <TabLayoutSidebar>
                  <ResultsViewSidebar
                    runView={runView}
                    runStatus={runStatus}
                    runId={runId}
                    projectId={projectId}
                    datasets={datasets}
                    datasetsByRefname={datasetsByRefname}
                    changeSelectedPanel={selectedPanel => this.setState({ selectedPanel })}
                    analyses={analyses}
                  />
                </TabLayoutSidebar>
                {this.renderContent(noMeasurements, noAnalysis, datarefOrId, dataset, run)}
              </TabLayout>
            );
          }
        }
      </TabRouter>
    );
  }
}

const getStateFromStores = (props) => {
  const { subdomain, runId, runView, runStatus } = props.match.params;

  const run            = RunStore.getById(runId);
  const refs           = RefStore.getByRunId(runId).toList();
  const instructions   = orderedInstructionsWithRefNames(InstructionStore.getByRunId(runId), refs);
  const instructionIds = instructions.map(i => i.get('id')).toSet();
  const projectId = props.match.params.projectId || (run && run.get('project_id'));

  const datasets = DatasetStore.getAll().filter((d) => {
    return d.get('run_id') == runId || instructionIds.contains(d.get('id'));
  });

  let fullJSON;
  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run, instructions, refs });
  }

  return {
    subdomain,
    projectId,
    runId,
    datasets,
    run: fullJSON,
    runView,
    runStatus
  };
};

const ConnectedResultsView = ConnectToStores(ResultsView, getStateFromStores);

ConnectedResultsView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      subdomain: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      runId:     PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default ConnectedResultsView;
