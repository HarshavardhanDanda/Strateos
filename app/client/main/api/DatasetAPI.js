import API from 'main/api/API';
import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import RunStore from 'main/stores/RunStore';

class DatasetAPI extends API {
  constructor() {
    super('datasets');
  }

  createDataset(data) {
    const url = this.createUrl('', {});
    ajax.post(url, data)
      .then(response => {
        const dataset = {
          ...response.data.attributes,
          id: response.data.id,
        };
        const run = RunStore.getById(data.run_id);
        const originalDatasets = run.get('datasets');
        const updatedDatasets = originalDatasets.push(dataset);
        const updatedRun = run.set('datasets', updatedDatasets);
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run: updatedRun.toJS()
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
}

export default new DatasetAPI();
