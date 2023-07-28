import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Spinner, ZeroState } from '@transcriptic/amino';

import DatasetActions       from 'main/actions/DatasetActions';
import PendingDataset       from 'main/components/datasets/PendingDataset';
import ConnectToStores      from 'main/containers/ConnectToStoresHOC';
import DatasetStore         from 'main/stores/DatasetStore';
import RunStore             from 'main/stores/RunStore';
import InstructionStore from 'main/stores/InstructionStore';
import RunActions           from 'main/actions/RunActions';
import getIdFromEmbeddedId  from 'main/util/ParamUtil';

import ResultsViewContent from 'main/pages/RunPage/views/ResultsView/ResultsViewContent';

class RunDatum extends React.Component {

  static get propTypes() {
    return {
      datasetId: PropTypes.string,
      run:       PropTypes.instanceOf(Immutable.Map)
    };
  }

  componentWillMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps, _prevState) {
    const datasetsAreDifferent = prevProps.datasetId !== this.props.datasetId;
    const missingData = !DatasetStore.has(this.props.datasetId);

    if (datasetsAreDifferent && missingData) {
      this.fetch();
    }
  }

  fetch() {
    if (this.props.datasetId) {
      DatasetActions.load(this.props.datasetId);
    }
  }

  render() {
    const dataset = DatasetStore.getById(this.props.datasetId);
    const instructionId = dataset && dataset.get('instruction_id');
    const instruction = InstructionStore.getById(instructionId);
    if (this.props.datasetId == undefined) {
      return <PendingDataset />;
    } else if (!dataset) {
      return <Spinner />;
    } else if (dataset && dataset.get('deleted_at')) {
      return <ZeroState title="This dataset has been deleted" />;
    }

    return (
      <ResultsViewContent
        name={instruction.getIn(['operation', 'dataref'])}
        dataset={dataset}
        run={this.props.run}
      />
    );
  }
}

class RunDatumPage extends React.Component {

  static get propTypes() {
    return {
      datasetId: PropTypes.string.isRequired,
      dataset:   PropTypes.instanceOf(Immutable.Map),
      run:       PropTypes.instanceOf(Immutable.Map)
    };
  }

  componentWillMount() {
    const { datasetId } = this.props;

    if (datasetId) {
      const datasetPromise = this.fetchDataset(datasetId);

      datasetPromise.then((dataset) => {
        this.fetchRun(dataset.parent_project_id, dataset.parent_run_id);
      });
    }
  }

  fetchRun(project_id, run_id) {
    return RunActions.load(project_id, run_id).fail(err => console.log(`${err.status}`));
  }

  fetchDataset(datasetId) {
    // We fetch the parent run/project ids here for fetching the run subsequently
    return DatasetActions.load(datasetId, 'short_with_parent_ids').fail(err => console.log(`${err.status}`));
  }

  render() {
    const { datasetId } = this.props;
    const { dataset }   = this.props;
    const { run }       = this.props;

    // Note: Replicated some of the run datum logic due to error state handling
    if (datasetId === undefined) {
      return <PendingDataset />;
    } else if (!dataset) {
      return <Spinner />;
    } else if (dataset && dataset.get('deleted_at')) {
      return <ZeroState title="This dataset has been deleted" />;
    } else if (dataset && !run) {
      return <Spinner />;
    }

    return (
      <ResultsViewContent
        name={datasetId}
        dataset={dataset}
        run={run}
      />
    );
  }

}

const getStateFromStores = function(props) {
  const datasetId = getIdFromEmbeddedId(props.match.params.datasetId);
  const dataset   = DatasetStore.getById(datasetId);
  const run       = dataset && RunStore.getById(dataset.get('parent_run_id'));

  return {
    datasetId,
    dataset,
    run
  };
};

const ConnectedRunDatumPage = ConnectToStores(RunDatumPage, getStateFromStores);
ConnectedRunDatumPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      datasetId: PropTypes.string
    })
  })
};

const ConnectedRunDatum = ConnectToStores(RunDatum, () => {});

export {
  ConnectedRunDatum as RunDatum,
  ConnectedRunDatumPage as RunDatumPage
};
