import SessionStore from 'main/stores/SessionStore';
import testRun from 'main/test/run-json/everyInstructionAdminRun.json';
import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import enzyme from 'enzyme';
import Immutable  from 'immutable';
import { BrowserRouter as Router } from 'react-router-dom';
import AcsControls from 'main/util/AcsControls';
import Urls from 'main/util/urls';
import FeatureStore from 'main/stores/FeatureStore';
import WorkflowStore from 'main/stores/WorkflowStore';
import FeatureConstants from '@strateos/features';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { WorkflowActions } from 'main/actions/WorkflowActions';
import ProgramExecutionsActions from 'main/actions/ProgramExecutionsActions';
import { thennable, getMockGqlClient } from 'main/util/TestUtil';
import ModalActions  from 'main/actions/ModalActions';
import RunActions from 'main/actions/RunActions';
import * as client from 'main/util/graphql/client';
import Header from './Header';

const immutableTestRun = Immutable.fromJS(testRun);

const rawOwner = testRun.owner;
const immutableOwner = Immutable.fromJS(rawOwner);

const rawProject = testRun.project;
const immutableProject = Immutable.fromJS(rawProject);
const workflowInstance = {
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

const completedTestRun = {
  id: 'r11ewre3423',
  status: 'complete',
  title: null,
  created_at: '2017-07-06T14:59:30.982-07:00',
  updated_at: '2017-07-06T14:59:31.480-07:00',
  completed_at: null,
  conversation_id: 'conv1aey3uu7vdve',
  lab_id: 'lb1ffs4sq45qa7a',
  success: false,
  success_notes: 'test note',
  test_mode: false,
  organizationId: 'org13'
};

describe('Header', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(client, 'getWorkflowGraphQLClient').returns(getMockGqlClient());
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  });

  it('should render', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    expect(header).to.be.ok;
  });

  it('should render Submitter text and user abbreviation displayed on page header', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    expect(header).to.be.ok;
    const userProfileLabel = header.dive().find('UserProfile').dive().find('div')
      .find('h4');
    expect(userProfileLabel.text()).to.be.equal('Submitter:');
  });

  it('should render user abbreviation displayed on page header', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    expect(header).to.be.ok;
    const userProfile = header.dive().find('UserProfile');
    expect(userProfile.dive().find('Profile')).to.be.length(1);
  });

  it('should have correct href on hamburger action Prime Directive', () => {
    Urls.use('transcriptic');
    const runId = immutableTestRun.get('id');
    const runStatus = immutableTestRun.get('status');
    const prime_directive_url = `/transcriptic/runspage/queue/${runStatus}/runs/${runId}/prime`;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    const primeDirectiveAction = instance.actions().filter(action => {
      return action.text === 'Prime Directive';
    });

    expect(primeDirectiveAction[0].href).to.equal(prime_directive_url);
  });

  it('should have correct href on hamburger action Prime Directive with runStatus runView props', () => {
    Urls.use('transcriptic');
    const runId = immutableTestRun.get('id');
    const prime_directive_url = `/transcriptic/runspage/approvals/pending/runs/${runId}/prime`;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        runStatus="pending"
        runView="approvals"
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    const primeDirectiveAction = instance.actions().filter(action => {
      return action.text === 'Prime Directive';
    });

    expect(primeDirectiveAction[0].href).to.equal(prime_directive_url);
  });

  it('should allow non admin users to view Launch Parameters', () => {
    sandbox.stub(SessionStore, 'isAdmin').callsFake(() => false);
    sinon.stub(immutableTestRun, 'get').callsFake(() => []);

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[11].disabled).to.equal(false);
  });

  it('should show the View Reaction Summary', () => {
    const immutableTestRun = Immutable.fromJS(testRun);
    const reactionId = immutableTestRun.get('reaction_id');
    const org = immutableTestRun.getIn(['project', 'organization', 'subdomain']);
    const reaction_url = `/${org}/reactions/${reactionId}`;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
        reactionId={reactionId}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[6].text).to.equal('View Reaction Summary');
    expect(instance.actions()[6].href).to.equal(reaction_url);
    expect(instance.actions()[6].disabled).to.equal(false);
  });

  it('should disable View Run Feedback for in_progress run', () => {
    const immutableTestRun = Immutable.fromJS({ ...completedTestRun, status: 'in_progress' });

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[7].text).to.equal('View Run Feedback');
    expect(instance.actions()[7].disabled).to.be.true;
  });

  it('should show Leave Run Feedback for canceled run', () => {
    const immutableTestRun = Immutable.fromJS({ ...completedTestRun, status: 'canceled', canceled_at: '2017-08-06T14:59:30.982-07:00', success_notes: null });

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[7].text).to.equal('Leave Run Feedback');
    expect(instance.actions()[7].disabled).to.be.false;
  });

  it('should show View Run Feedback if succes_notes is present', () => {
    const immutableTestRun = Immutable.fromJS(completedTestRun);

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[7].text).to.equal('View Run Feedback');
    expect(instance.actions()[7].disabled).to.be.false;
  });

  it('should show Leave Run Feedback if succes_notes is not present', () => {
    const immutableTestRun = Immutable.fromJS({ ...completedTestRun, success_notes: null });

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[7].text).to.equal('Leave Run Feedback');
    expect(instance.actions()[7].disabled).to.be.false;
  });

  it('should not show the View Reaction Summary when reaction id is null', () => {
    const immutableTestRun = Immutable.fromJS(testRun);
    const reactionId = undefined;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
        reactionId={reactionId}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[6].disabled).to.equal(true);
  });

  it('switch to external run should not be visible for ccs org not being utilized by labs', () => {
    sandbox.stub(SessionStore, 'hasFeature').withArgs('ccs_org').callsFake(() => true);
    const labConsumers = [{ id: 'org1' }];
    sandbox.stub(SessionStore, 'isAdmin').callsFake(() => true);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).callsFake(() => true);
    sandbox.stub(LabConsumerActions, 'loadLabConsumersByLab').returns({
      done: (cb) => {
        cb({
          data: labConsumers
        });
      }
    });
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const wrapper = header.instance();
    wrapper.setState({ hasLabConsumers: false });
    expect(wrapper.actions()[9].disabled).to.equal(true);
  });

  it('switch to external run should be visible for ccs org being utilized by labs', () => {
    sandbox.stub(SessionStore, 'hasFeature').withArgs('ccs_org').callsFake(() => true);
    const labConsumers = [{ id: 'org1' }, { id: 'org2' }];
    sandbox.stub(SessionStore, 'isAdmin').callsFake(() => true);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).callsFake(() => true);
    sandbox.stub(LabConsumerActions, 'loadLabConsumersByLab').returns({
      done: (cb) => {
        cb({
          data: labConsumers
        });
      }
    });
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const wrapper = header.instance();
    wrapper.setState({ hasLabConsumers: true });
    expect(wrapper.actions()[9].disabled).to.equal(false);
  });

  it('should render Cancel Run button if user has the persmission', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.CANCEL_RUN_IN_LAB).returns(true);
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[14].disabled).to.equal(false);
    expect(instance.actions()[14].text).to.equal('Cancel Run');
  });

  it('should open Run Feedback modal after run is cancelled', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.CANCEL_RUN_IN_LAB).returns(true);
    const spy = sinon.stub(RunActions, 'cancel').returns({ done: (cb) => cb() });
    const modalOpenSpy = sinon.spy(ModalActions, 'open');
    sinon.stub(global, 'confirm').returns(true);

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[14].text).to.equal('Cancel Run');
    instance.actions()[14].onClick();
    expect(spy.calledOnce, 'RunActions cancel method is being called').to.be.true;
    expect(modalOpenSpy.calledWithExactly('RunFeedbackModal'), 'RunFeedbackModal open is being called').to.be.true;
  });

  it('should open Run Feedback modal after run is aborted', () => {
    const immutableTestRun = Immutable.fromJS({ ...testRun, status: 'in_progress' });
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS).returns(true);
    const spy = sinon.stub(RunActions, 'abortRun').returns({ done: (cb) => cb() });
    const modalOpenSpy = sinon.spy(ModalActions, 'open');
    sinon.stub(global, 'confirm').returns(true);

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[14].text).to.equal('Abort Run');
    instance.actions()[14].onClick();
    expect(spy.calledOnce, 'RunActions abortRun method is being called').to.be.true;
    expect(modalOpenSpy.calledWithExactly('RunFeedbackModal'), 'RunFeedbackModal open is being called').to.be.true;
  });

  it('should not render Cancel Run if user does not have the permission', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[14].disabled).to.equal(true);
    expect(instance.actions()[14].text).to.equal('Cancel Run');
  });

  it('should not render Show Experiment if user does not have the permission', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[12].text).to.equal('Show Experiment');
    expect(instance.actions()[12].disabled).to.equal(true);
  });

  function renderAndAssertShowExperiment() {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).callsFake(() => true);
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    expect(instance.actions()[12].text).to.equal('Show Experiment');
    expect(instance.actions()[12].disabled).to.equal(false);
  }

  it('should render Show Experiment if user has the permission and run has instance id from store', () => {
    sandbox.stub(WorkflowStore, 'getInstanceByRunId').returns(workflowInstance);
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    renderAndAssertShowExperiment();
    expect(loadInstanceSpy.notCalled).to.be.true;
  });

  it('should render Show Experiment if user has the permission and run has instance id from fetch', () => {
    sandbox.stub(WorkflowStore, 'getInstanceByRunId').returns(undefined);
    const loadInstanceStub = sandbox.stub(WorkflowActions, 'loadInstanceByRun').returns(thennable(workflowInstance));
    renderAndAssertShowExperiment();
    expect(loadInstanceStub.calledOnce).to.be.true;
    expect(loadInstanceStub.callCount).to.be.equal(1);
  });

  it('should redirect to experiments page with Show Experiment action', () => {
    sandbox.stub(WorkflowStore, 'getInstanceByRunId').returns(workflowInstance);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).callsFake(() => true);
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    expect(instance.actions()[12].text).to.equal('Show Experiment');
    expect(instance.actions()[12].href).to.equal(`/transcriptic/workflows/experiments/${workflowInstance.id}`);
  });

  it('should render Clone Run button if user has the persmission', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.CLONE_RUN_IN_LAB).returns(true);
    const runValues = immutableTestRun.toJS();
    runValues.launch_request_id = 'something';
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[5].disabled).to.equal(false);
  });

  it('should not render Clone Run if user does not have the permission', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[5].disabled).to.equal(true);
  });

  it('have correct link on hamburger action CloneRun with runView props', () => {
    Urls.use('transcriptic');
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.CLONE_RUN_IN_LAB).returns(true);
    const runValues = immutableTestRun.toJS();
    runValues.launch_request_id = 'something';
    const cloneRunUrl = `/transcriptic/${immutableProject.get('id')}/runs/${immutableTestRun.get('id')}/clone/queue`;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        runView="queue"
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    const cloneRunAction = instance.actions().filter(action => {
      return action.text === 'Clone Run';
    });

    expect(cloneRunAction[0].to).to.equal(cloneRunUrl);
  });

  it('have correct link on hamburger action CloneRun without runView props', () => {
    Urls.use('transcriptic');
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.CLONE_RUN_IN_LAB).returns(true);
    const runValues = immutableTestRun.toJS();
    runValues.launch_request_id = 'something';
    const cloneRunUrl = `/transcriptic/${immutableProject.get('id')}/runs/${immutableTestRun.get('id')}/clone`;

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );

    const instance = header.instance();
    const cloneRunAction = instance.actions().filter(action => {
      return action.text === 'Clone Run';
    });

    expect(cloneRunAction[0].to).to.equal(cloneRunUrl);
  });

  it('should allow operator to upload dataset', () => {
    sandbox.stub(SessionStore, 'isAdmin').callsFake(() => false);
    sinon.stub(immutableTestRun, 'get').callsFake(() => []);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([{
      featureGroup: {
        label: 'Operator'
      }
    }]);

    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[1].disabled).to.equal(false);
  });

  it('should call executePostRunPrograms on trigger click when programExecution exists for run', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE, 'labId').returns(true);
    const completedRun = Immutable.fromJS(testRun).set('status', 'complete');
    const spy = sinon.spy(ProgramExecutionsActions, 'createAndExecutePostRunProgram');
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={completedRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();

    expect(instance.actions()[13].text).to.equal('Trigger program');
    instance.actions()[13].onClick();
    expect(spy.calledOnce).to.be.true;
  });

  it('should not render Trigger program option if user does not have the permission', () => {
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[13].disabled).to.equal(true);
    expect(instance.actions()[13].text).to.equal('Trigger program');
  });

  it('should not render Trigger program option for not completed runs', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE, 'labId').returns(true);
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[13].disabled).to.equal(true);
    expect(instance.actions()[13].text).to.equal('Trigger program');
  });

  it('should not render Trigger program option when completed run does not have post run programs', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE, 'labId').returns(true);
    const completedRun = Immutable.fromJS(testRun).set('status', 'complete');
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={completedRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[13].disabled).to.equal(true);
    expect(instance.actions()[13].text).to.equal('Trigger program');
  });

  it('should not render Trigger program option while an existing program execution is in progress', () => {
    sinon.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE, 'labId').returns(true);
    const completedRun = Immutable.fromJS(testRun).set('status', 'complete');
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={completedRun}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    instance.setState({ postRunProgramExecuting: true });
    expect(instance.actions()[13].disabled).to.equal(true);
  });

  it('should render Run Settings button if user has the view edit run persmission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS).returns(true);

    const runValues = immutableTestRun.toJS();
    runValues.lab_id = 'labId';
    runValues.organization_id = 'org13';
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[4].disabled).to.equal(false);
    expect(instance.actions()[4].text).to.equal('Run Settings');
  });

  it('should render Run Settings button if user has the view runs in labs persmission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS, 'labId').returns(true);

    const runValues = immutableTestRun.toJS();
    runValues.lab_id = 'labId';
    runValues.organization_id = 'org13';
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[4].disabled).to.equal(false);
    expect(instance.actions()[4].text).to.equal('Run Settings');
  });

  it('should not render Run Settings button if user does not have the permission', () => {
    const runValues = immutableTestRun.toJS();
    runValues.lab_id = 'labId';
    runValues.organization_id = 'org13';
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    expect(instance.actions()[4].disabled).to.equal(true);
    expect(instance.actions()[4].text).to.equal('Run Settings');
  });

  it('should open Run Settings modal when clicked on run settings button', () => {
    const spy = sinon.spy(ModalActions, 'open');
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS, 'labId').returns(true);
    const runValues = immutableTestRun.toJS();
    runValues.lab_id = 'labId';
    runValues.organization_id = 'org13';
    const header = enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    const instance = header.instance();
    instance.actions()[4].onClick();
    expect(spy.calledOnce).to.be.true;
  });

  it('should not load workflow instance when user does not have permission', () => {
    const runValues = immutableTestRun.toJS();
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).returns(false);
    enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    expect(loadInstanceSpy.calledOnce).to.be.false;
  });

  it('should load workflow instance when user have permission', () => {
    const runValues = immutableTestRun.toJS();
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).returns(true);
    enzyme.shallow(
      <Header
        project={immutableProject}
        run={Immutable.fromJS(runValues)}
        owner={immutableOwner}
      />
    );
    expect(loadInstanceSpy.calledOnce).to.be.true;
  });

  it('should indicate when project is an implementation project', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.LAUNCH_RUN).returns(true);
    const runValues = immutableTestRun.toJS();
    const implementationProject = immutableProject.set('is_implementation', true);
    const header = enzyme.mount(
      <Router>
        <Header
          project={implementationProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    const launchButton = header.find('Button').filterWhere(button => button.text() === 'Launch Run');
    expect(launchButton.props().type).to.equal('secondary');
    expect(header.find('ImplementationProjectIndicator').length).to.equal(1);
  });

  it('should set page header as primary type by default', () => {
    const runValues = immutableTestRun.toJS();
    const header = enzyme.mount(
      <Router>
        <Header
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    expect(header.find('PageHeader').props().type).to.equal('primary');
  });

  it('should render user profile when owner is provided', () => {
    const runValues = immutableTestRun.toJS();
    const header = enzyme.mount(
      <Router>
        <Header
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    expect(header.find('UserProfile').length).to.equal(1);
    const PrimaryInfo = header.find('PageHeader').props().primaryInfoArea;
    expect(PrimaryInfo[0].props.label).to.be.equal('Submitter');
  });

  it('should render Launch Run button if user has the lunch run feature ', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.LAUNCH_RUN).returns(true);
    const runValues = immutableTestRun.toJS();
    const header = enzyme.mount(
      <Router>
        <Header
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    const launchButton = header.find('Button').filterWhere(button => button.text() === 'Launch Run');
    expect(launchButton.props().type).to.equal('primary');
    expect(launchButton.props().children).to.equal('Launch Run');
  });

  it('should render Test Mode label when run is test run and should not render Add payment button', () => {
    const runValues = immutableTestRun.set('test_mode', true).toJS();
    const header = enzyme.mount(
      <Router>
        <Header
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    expect(header.find('RunStatusLabel').at(1).props().isTestMode).to.be.true;
    expect(header.find('Button').filterWhere(button => button.text() === 'Add Payment')).to.length(0);
  });

  it('should render Add Payment button for invalid payment', () => {
    sandbox.stub(SessionStore, 'isOrgAdmin').callsFake(() => true);
    const runValues = immutableTestRun.set('billing_valid?', false).toJS();
    const header = enzyme.mount(
      <Router>
        <Header
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
        />
      </Router>
    );
    const launchButton = header.find('Button').filterWhere(button => button.text() === 'Add Payment');
    expect(launchButton.props().type).to.equal('warning');
    expect(launchButton.props().children).to.equal('Add Payment');
    expect(header.find('RunStatusLabel').length).to.be.equal(1);
  });

});
