import Dispatcher          from 'main/dispatcher';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';
import RunStore            from 'main/stores/RunStore';

const DatasetActions = {
  load(id, json_type = 'full') {
    // Note: json_type 'full' implicitly defaults to a 'Dataset.full_json' representation
    return ajax.get(Urls.dataset(id), { json_type: json_type })
      .done(dataset => Dispatcher.dispatch({ type: 'DATASET_DATA', dataset }));
  },

  loadAll(datasetIds) {
    const loadDatasetIds = datasetIds.map(datasetId => this.load(datasetId, 'short'));
    return ajax.when(...loadDatasetIds);
  },

  destroyAll(datasetIds) {
    const deleteDatasetIds = datasetIds.map(datasetId => this.destroy(datasetId));
    return ajax.when(...deleteDatasetIds);
  },

  destroy(id, run_id, comment) {
    return ajax.delete(Urls.dataset(id), { comment })
      .done((dataset) => {
        Dispatcher.dispatch({ type: 'DATASET_DATA', dataset });

        if (run_id) {
          const run = RunStore.getById(run_id);
          const originalDatasets = run.get('datasets');
          const updatedDatasets = originalDatasets.filter(d => d.get('id') != id);
          const updatedRun = run.set('datasets', updatedDatasets);
          Dispatcher.dispatch({
            type: 'RUN_DATA',
            run: updatedRun.toJS(),
          });
        }
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroyDatasetPrimeDirective(id) {
    return ajax.delete(Urls.dataset_prime(id));
  }
};

export default DatasetActions;
