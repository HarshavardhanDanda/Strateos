import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import DatasetActions from './DatasetActions';

describe('DatasetActions', () => {
  const sandbox = sinon.createSandbox();
  const datasetId = 'd1gz28b3ydp3d4';
  const runId = 'r1ezzv9tpqrq23';
  const response = {
    created_at: '2022-05-02T15:22:25.852-07:00',
    id: 'd1gz28b3ydp3d4',
    instruction_id: null,
    is_analysis: true,
    run_id: 'r1ezzv9tpqrq23',
    title: 'sample19.csv',
    uploaded_by: 'u18dcbwhctbnj',
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should delete a dataset', () => {
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');
    const comment = 'outdated';
    const deleteDataset = sandbox.stub(ajax, 'delete').returns({
      done: () => {
        Dispatcher.dispatch({
          type: 'DATASET_DATA',
          dataset: response
        });
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run: response
        });
        return { fail: () => ({}) };
      }
    });
    DatasetActions.destroy(datasetId, runId, comment);
    expect(deleteDataset.calledWithExactly(`/datasets/${datasetId}`, { comment: comment })).to.be.true;
    expect(dispatch.calledWithExactly({
      type: 'DATASET_DATA',
      dataset: response
    })).to.be.true;
    expect(dispatch.calledWithExactly({
      type: 'RUN_DATA',
      run: response
    })).to.be.true;
  });
});
