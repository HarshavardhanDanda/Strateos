import React from 'react';
import { expect } from 'chai';
import Moment    from 'moment';
import Immutable from 'immutable';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { StaticRouter } from 'react-router-dom';
import sinon from 'sinon';
import WorkflowStore from 'main/stores/WorkflowStore';
import InstructionsView from './index';
import { WorkflowActions } from '../../../../actions/WorkflowActions';

const routeProps = {
  match: {
    isExact: true,
    params: {
      projectId: '',
      runId: '',
      subdomain: '',
      path: '',
      url: ''
    }
  },
  history: {
    replace: () => {}
  },
  location: {}
};

const generateFakeRun = ({ loadRun, loadInstructions, loadRefs }) => {
  if (!loadRun) return undefined;

  return Immutable.fromJS({
    id: '',
    request_type: 'protocol',
    datasets: [
      {
        id: 'dataset1',
        instruction_id: 'Instruction1'
      },
      {
        id: 'dataset2',
        instruction_id: 'Instruction2'
      }
    ],
    dependents: [],
    status: '',
    bsl: 1,
    instructions: loadInstructions ? [
      {
        id: 'Instruction1',
        operation: { dataref: 'dataRef1' },
        warps: [],
        sequence_no: '1231'
      },
      {
        id: 'Instruction2',
        operation: { dataref: 'dataRef2' },
        warps: [],
        sequence_no: '123211'
      }
    ] : undefined,
    refs: loadRefs ? [
      { name: 'ref1' },
      { name: 'ref2' }
    ] : undefined
  });
};

const generateRunPageShallowWrapper = (props) => {
  const RunDataPageComponent = enzyme.shallow(
    <InstructionsView
      {...routeProps}
      {...props}
    />
  ).dive(
    {
      context: {
        router: {
          route: {
            location: {
              pathname: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/data/dataRef1'
            }
          }
        }
      }
    }
  );
  return RunDataPageComponent;
};

const generateRunExecutionPageRootWrapper = (props) => {
  // .find and .dive are necessary for Enzyme to
  // access RunExecutionPage component nested within ConnectedRunExecutionPage.
  const RunExecutionPageComponent = enzyme.mount(
    <StaticRouter
      location="/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/instructions"
      context={{
        context: {
          router: {
            route: {
              location: {
                pathname: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/instructions'
              }
            }
          }
        }
      }}
    >
      <InstructionsView
        {...routeProps}
        {...props}
      />
    </StaticRouter>
  );

  return RunExecutionPageComponent;
};

describe('RunExecutionPage', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  it('should render without throwing', () => {
    enzyme.shallow(<InstructionsView {...routeProps} />);
  });

  it('should change status code when fetch errors out', () => {
    const instance = generateRunPageShallowWrapper().instance();

    instance.onStatusCodeChange(400);

    expect(instance.state.statusCode).to.equal(400);
  });

  it('should show <PageLoading /> if run is not present', () => {
    const component = generateRunExecutionPageRootWrapper({
      hasLoadedRun: false,
      hasLoadedInstructions: false,
      hasLoadedRefs: false
    });

    const pageLoadingComponent = component.find('PageLoading');
    const panelLayoutComponent = component.find('PanelLayout');
    const runRequestComponent = component.find('RunRequest');

    expect(pageLoadingComponent).to.have.length(1);
    expect(panelLayoutComponent).to.have.length(0);
    expect(runRequestComponent).to.have.length(0);
  });

  it('should show <RunRequest /> if instructions and refs are loaded', () => {
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const component = generateRunExecutionPageRootWrapper({ run: fakeRun });

    const pageLoadingComponent = component.find('PageLoading');
    const runRequestComponent = component.find('RunRequest');

    expect(pageLoadingComponent).to.have.length(0);
    expect(runRequestComponent).to.have.length(1);
  });

  it('onNavigateRef should modify selectedRef state', () => {
    const instance = generateRunPageShallowWrapper().instance();
    instance.setState({
      selectedRef: undefined,
      selectedDataRef: undefined
    });

    instance.onNavigateRef('Foo');

    expect(instance.state.selectedRef).to.equal('Foo');
    expect(instance.state.selectedDataRef).to.equal(undefined);
  });

  it('onNavigateDataref should modify selectedDataRef state', () => {
    const instance = generateRunPageShallowWrapper().instance();
    instance.setState({
      selectedRef: undefined,
      selectedDataRef: undefined
    });

    instance.onNavigateDataref('Bar');

    expect(instance.state.selectedRef).to.equal(undefined);
    expect(instance.state.selectedDataRef).to.equal('Bar');
  });

  it('RunRefContainer should render when selectedRef is defined', (done) => {
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const component = generateRunPageShallowWrapper({ run: fakeRun });

    component.setState({ selectedRef: 'ref1', selectedDataRef: undefined }, () => {
      expect(component.find('RunRefContainer')).to.have.length(1);
      expect(component.find('ConnectedRunDatum')).to.have.length(0);
      done();
    });
  });

  it('getFocusedDataset should return matching dataset from instructions', (done) => {
    const selectedDataRef = 'dataRef2';
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const instance = generateRunPageShallowWrapper({
      run: fakeRun
    }).instance();

    instance.setState({ selectedDataRef }, () => {
      const dataset = instance.getFocusedDataset();

      expect(dataset).to.not.be.undefined;
      expect(dataset.get('id')).to.equal('dataset2');
      done();
    });
  });

  it('should render timing stats for accepted run with scheduled_to_start_at as Scheduled to start', () => {
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true
    });

    const scheduled_to_start_at = Moment().add(1, 'd').toDate();
    fakeRun = fakeRun.merge({ status: 'accepted', scheduled_to_start_at });

    const instructionView = generateRunPageShallowWrapper({
      run: fakeRun
    });

    expect(instructionView.find('.hidden-print').render().text()).to.equal(`Scheduled to start ${Moment(scheduled_to_start_at).format('MMM D, YYYY')}`);
  });

  it('should render timing stats for accepted run with scheduled_to_start_at as Delayed past scheduled start', () => {
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true
    });

    const scheduled_to_start_at = Moment().subtract(1, 'd').toDate();
    fakeRun = fakeRun.merge({ status: 'accepted', scheduled_to_start_at });

    const instructionView = generateRunPageShallowWrapper({
      run: fakeRun
    });

    expect(instructionView.find('.hidden-print').render().text()).to.equal(`Delayed past scheduled start ${Moment(scheduled_to_start_at).format('MMM D, YYYY')}`);
  });

  it('getFocusedRef should return matching ref from run', (done) => {
    const selectedRef = 'ref2';
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const instance = generateRunPageShallowWrapper({ run: fakeRun }).instance();

    instance.setState({ selectedRef }, () => {
      const ref = instance.getFocusedRef();

      expect(ref).to.not.be.undefined;
      expect(ref.get('name')).to.equal(selectedRef);
      done();
    });
  });

  it('should show workflow viewer link if run submitted from an Experiment', () => {
    const instance = {
      id: '3302a892-6129-46ae-a8e4-b8dee9d41e85',
      createdBy: 'SYSTEM',
      createdOn: '2020-10-15T01:37:54+0000',
      lastModifiedBy: 'SYSTEM',
      lastModifiedOn: '2020-10-15T01:38:00+0000',
      label: 'Passage Cells Till Concentration',
      state: 'RUNNING',
      definitionId: '6512bd43-d9ca-a6e0-2c99-0b0a82652dca',
      definitionLabel: 'Passage Cells Till Concentration',
      organizationId: 'org13',
      submitRunsInTestMode: false
    };
    const loadInstanceStub = sandbox.stub(WorkflowActions, 'loadInstanceByRun').returns(instance);
    sandbox.stub(WorkflowStore, 'getInstanceByRunId').returns(instance);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_WORKFLOWS).callsFake(() => true);
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const component = generateRunExecutionPageRootWrapper({ run: fakeRun });
    expect(component.find('span').at(0).find('h4').text()).to.equal('Workflow');
    expect(component.find('span').at(0).find('Link').children()
      .text()).to.equal(instance.definitionLabel);
    expect(component.find('span').at(0).find('Link').prop('to')).to.equal(`/transcriptic/workflows/viewer/${instance.definitionId}`);
    expect(loadInstanceStub.callCount).to.be.equal(0);
  });

  it('should show relavent protocol run is not submitted from an Experiment', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_WORKFLOWS).callsFake(() => false);
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const component = generateRunExecutionPageRootWrapper({ run: fakeRun });
    expect(component.find('TabLayout').find('h4').at(0).text()).to.equal('Protocol');
  });

  it('should have gray as TabLayout background color', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_WORKFLOWS).callsFake(() => false);
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    const component = generateRunExecutionPageRootWrapper({ run: fakeRun });
    const tabLayout = component.find('TabLayout');

    expect(tabLayout.length).to.equals(1);
    expect(tabLayout.props().theme).to.equals('gray');
  });
});
