import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { StaticRouter } from 'react-router-dom';
import sinon from 'sinon';
import DatasetStore from 'main/stores/DatasetStore';
import InstructionStore from 'main/stores/InstructionStore';
import { RunDatum, RunDatumPage } from './index';

const pageRouteProps = {
  match: {
    isExact: true,
    params: {
      datasetId: '',
      subdomain: ''
    },
    path: '',
    url: ''
  },
  location: {}
};

const generateRunDatumPageWrapper = (props) => {
  const RunDatamPageComponent = enzyme.mount(
    <StaticRouter
      location="/datasets/d13jk6mvsedfjh.embed"
      context={{
        context: {
          router: {
            route: {
              location: {
                pathname: '/datasets/d13jk6mvsedfjh.embed'
              }
            }
          }
        }
      }}
    >
      <RunDatumPage
        {...pageRouteProps}
        {...props}
      />
    </StaticRouter>
  );

  return RunDatamPageComponent;
};

const generateFakeRun = ({ load }) => {
  if (!load) return undefined;

  return Immutable.fromJS({
    id: '',
    request_type: 'protocol',
    datasets: [
      {
        id: 'dataset1',
        instruction_id: 'Instruction1'
      }
    ],
    dependents: [],
    status: '',
    bsl: 1,
    instructions: [
      {
        id: 'Instruction1',
        operation: { dataref: 'dataRef1' },
        warps: []
      }
    ],
    refs: [
      { name: 'ref1' }
    ]
  });
};

const generateFakeDataset = ({ load, deleted_at }) => {
  if (!load) return undefined;

  return Immutable.fromJS({
    id: '',
    deleted_at: deleted_at ? 'some-date' : undefined,
  });
};

const generateFakeDatasetId = ({ defined }) => {
  if (!defined) return undefined;

  return 'dataset1';
};

describe('RunDatumPage', () => {
  it('should render RunDatumPage without throwing', () => {
    enzyme.shallow(<RunDatumPage {...pageRouteProps} />);
  });

  it('should show <PendingDataset /> if datasetId is undefined', () => {
    const component = generateRunDatumPageWrapper(
      {
        dataset: generateFakeDataset({ load: true }),
        run: generateFakeRun({ load: false }),
        datasetId: generateFakeDatasetId({ defined: false })
      }
    );

    const pendingDatasetComponent = component.find('PendingDataset');
    const spinnerComponent = component.find('Spinner');
    const zeroStateComponent = component.find('ZeroState');
    const resultViewContentComponent = component.find('ResultsViewContent');

    expect(pendingDatasetComponent).to.have.length(1);
    expect(spinnerComponent).to.have.length(0);
    expect(zeroStateComponent).to.have.length(0);
    expect(resultViewContentComponent).to.have.length(0);
  });

  it('should show <Spinner /> if dataset is not loaded', () => {
    const component = generateRunDatumPageWrapper(
      {
        dataset: generateFakeDataset({ load: true }),
        run: generateFakeRun({ load: false }),
        datasetId: generateFakeDatasetId({ defined: true })
      }
    );

    const pendingDatasetComponent = component.find('PendingDataset');
    const spinnerComponent = component.find('Spinner');
    const zeroStateComponent = component.find('ZeroState');
    const resultViewContentComponent = component.find('ResultsViewContent');

    expect(pendingDatasetComponent).to.have.length(0);
    expect(spinnerComponent).to.have.length(1);
    expect(zeroStateComponent).to.have.length(0);
    expect(resultViewContentComponent).to.have.length(0);
  });

  it('should show <Spinner /> if run is not loaded', () => {
    const component = generateRunDatumPageWrapper(
      {
        dataset: generateFakeDataset({ load: true }),
        run: generateFakeRun({ load: false }),
        datasetId: generateFakeDatasetId({ defined: true })
      }
    );

    const pendingDatasetComponent = component.find('PendingDataset');
    const spinnerComponent = component.find('Spinner');
    const zeroStateComponent = component.find('ZeroState');
    const resultViewContentComponent = component.find('ResultsViewContent');

    expect(pendingDatasetComponent).to.have.length(0);
    expect(spinnerComponent).to.have.length(1);
    expect(zeroStateComponent).to.have.length(0);
    expect(resultViewContentComponent).to.have.length(0);
  });

  it('should show <ZeroState /> if dataset has deleted_at attribute', () => {
    const component = generateRunDatumPageWrapper(
      {
        dataset: generateFakeDataset({ load: true, deleted_at: true }),
        run: generateFakeRun({ load: true }),
        datasetId: generateFakeDatasetId({ defined: true })
      }
    );

    const pendingDatasetComponent = component.find('PendingDataset');
    const spinnerComponent = component.find('Spinner');
    const zeroStateComponent = component.find('ZeroState');
    const resultViewContentComponent = component.find('ResultsViewContent');

    expect(pendingDatasetComponent).to.have.length(0);
    expect(spinnerComponent).to.have.length(0);
    expect(zeroStateComponent).to.have.length(1);
    expect(resultViewContentComponent).to.have.length(0);
  });

  it('should show <ResultViewContent /> if everything is loaded', () => {
    const component = generateRunDatumPageWrapper(
      {
        dataset: generateFakeDataset({ load: true }),
        run: generateFakeRun({ load: true }),
        datasetId: generateFakeDatasetId({ defined: true })
      }
    );

    const pendingDatasetComponent = component.find('PendingDataset');
    const spinnerComponent = component.find('Spinner');
    const zeroStateComponent = component.find('ZeroState');
    const resultViewContentComponent = component.find('ResultsViewContent');

    expect(pendingDatasetComponent).to.have.length(0);
    expect(spinnerComponent).to.have.length(0);
    expect(zeroStateComponent).to.have.length(0);
    expect(resultViewContentComponent).to.have.length(1);
  });
});

describe('RunDatum', () => {
  const sandbox = sinon.createSandbox();

  const instruction = Immutable.fromJS({
    executed_at: '2016-02-16T10:54:48.536-08:00',
    operation: {
      dataref: 'test_instruction',
      object: 'test_plate_384',
      mode: 'top',
      op: 'image_plate'
    },
    completed_at: '2016-02-16T10:57:21.253-08:00',
    created_at: '2016-02-16T10:50:47.533-08:00',
    run_id: 'r18pryz844aqc',
    type: 'instructions',
    id: 'i18pryz84e7kn'
  });

  const dataset = Immutable.fromJS({
    instruction_id: 'i18pryz84e7kn',
    instruction: {
      id: 'i18pryz84e7kn',
      operation: {
        dataref: 'test_instruction',
        object: 'test_plate_384',
        mode: 'top',
        op: 'image_plate'
      },
      completed_at: '2016-02-16T10:57:21.253-08:00',
      executed_at: '2016-02-16T10:54:48.536-08:00',
      run: {
        id: 'r18pryz844aqc',
        status: 'complete',
        title: 'maxAxes test 1.4x AccX AccY 5x AccZ, MaxSpeed 800'
      }
    },
    id: 'd1vpyx35wm8et'
  });
  const run = Immutable.fromJS({
    id: 'r18pryz844aqc',
    status: 'complete',
    title: 'maxAxes test 1.4x AccX AccY 5x AccZ, MaxSpeed 800'
  });

  afterEach(() => {
    sandbox.restore();
  });
  it('should render RunDatum without errors', () => {
    enzyme.shallow(<RunDatum datasetId={'d1zcy6w9w7yjx'} run={run} />);
  });

  it('should render ResultsViewContent with correct prop', () => {
    const rundatum = enzyme.shallow(<RunDatum datasetId={'d1vpyx35wm8et'} run={run} />);

    sandbox.stub(DatasetStore, 'getById')
      .withArgs('d1vpyx35wm8et').returns(dataset);
    sandbox.stub(InstructionStore, 'getById')
      .withArgs('i18pryz84e7kn').returns(instruction);

    const resultViewContentComponent = rundatum.dive().find('ConnectedResultsViewContent');
    expect(resultViewContentComponent.prop('name')).to.be.equal('test_instruction');
  });
});
