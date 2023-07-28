import React                    from 'react';
import { expect }               from 'chai';
import Immutable                from 'immutable';
import _                        from 'lodash';
import { groupInstructions }  from 'main/util/InstructionUtil';
import testRun                from 'main/test/run-json/everyInstructionAdminRun.json';
import sinon                  from 'sinon';
import ajax                   from 'main/util/ajax';
import ModalActions from 'main/actions/ModalActions';
import WorkcellStore          from 'main/stores/WorkcellStore';
import FileUtil    from 'main/util/FileUtil';
import CommonUiUtil from 'main/util/CommonUiUtil';
import { BrowserRouter } from 'react-router-dom';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import WorkcellActions from 'main/actions/WorkcellActions';
import FeatureStore from 'main/stores/FeatureStore';
import { PrimeDirective }    from './index';
import ExportCSVModal from './ExportCSVModal';

const provisionSpecs = Immutable.fromJS([
  {
    id: '4806',
    instruction_id: 'i1aey3utwj55x',
    transfers: [
      {
        to: 'test-flat',
        to_well_idx: 0,
        volume: 20,
        from: 'ct18gbq3aaxzvd',
        from_well_idx: 0
      }
    ],
    created_at: '2017-07-06T15:00:10.444-07:00',
    updated_at: '2017-07-06T15:00:10.444-07:00',
    resource_id: 'rs186wj7fvknsr'
  }
]);

const workcells = Immutable.fromJS([
  {
    id: 'wc123',
    name: 'wc4',
    workcell_id: 'wc4-frontend1',
    workcell_type: 'mcx'
  },
  {
    id: 'wc124',
    name: 'tempo',
    workcell_id: 'wc8-frontend1',
    workcell_type: 'integration'
  }
]);

const immutableTestRun = Immutable.fromJS(testRun);

const setStatePromise = (page, state) => {
  return new Promise((resolve) => {
    page.find(PrimeDirective).setState(state, () => resolve(page));
  });
};

const mountPage = (state = {}) => {
  const page = enzyme.mount(
    <BrowserRouter>
      <PrimeDirective
        runId={testRun.id}
        provisionSpecs={provisionSpecs}
        refsPanelOpen
        provisionPanelOpen
        workcells={workcells}
      />
    </BrowserRouter>
  );
  const initialState = {
    run: immutableTestRun,
    schedulerStats: { schedules: {} },
    instructionGroups: groupInstructions(immutableTestRun.get('instructions')),
    ...state
  };

  // Currently using setState because PrimeDirective is not yet using ConnectToStores
  // TODO Switch to passing in run as prop after converting to use ConnectToStores
  return setStatePromise(page, initialState);
};

describe('PrimeDirectivePage', () => {
  const sandbox = sinon.createSandbox();
  let page;

  beforeEach(async () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE).returns(true);
    page = await mountPage();
  });

  afterEach(() => {
    page.unmount();
    sandbox.restore();
  });

  it('should mount properly with test run', () => {
    expect(page).to.be.ok;
  });

  it('should have expected components', () => {
    const primeDirective = page.find(PrimeDirective);
    expect(primeDirective.find('RunBreadCrumbs').length).to.equal(1);
    expect(primeDirective.find('RunStatusLabel').length).to.equal(1);
    expect(primeDirective.find('ButtonGroup').length).to.equal(1);
    expect(primeDirective.find('GroupedInstructions').length).to.equal(1);
  });

  it('should show all the workcells in the WorkcellDrawer including async_integration type workcell when all instructions are selected', async () => {
    const primeDirective = page.find(PrimeDirective);
    const newSelectedState = primeDirective.instance().setSelectAllState();
    primeDirective.state().selected = newSelectedState;
    await setStatePromise(page, primeDirective.state());
    page.update();
    const workcellDrawerChoices = page.find('SendToWorkcellDrawer').props().workcellChoices;

    expect(workcells.getIn(['1', 'name'])).to.equal(workcellDrawerChoices[1].name);
    expect(workcells.getIn(['1', 'workcell_id'])).to.equal(workcellDrawerChoices[1].id);
    expect(workcells.getIn(['0', 'name'])).to.equal(workcellDrawerChoices[2].name);
    expect(workcells.getIn(['0', 'workcell_id'])).to.equal(workcellDrawerChoices[2].id);
  });

  it('should show workcells in the WorkcellDrawer excluding async_integration type workcell when all instructions are not selected', () => {
    const primeDirective = page.find(PrimeDirective);
    primeDirective.instance().selectForWorkcell(immutableTestRun.getIn(['instructions', '0']), {});
    page.update();
    const workcellDrawerChoices = page.find('SendToWorkcellDrawer').props().workcellChoices;

    expect(workcells.getIn(['0', 'name'])).to.equal(workcellDrawerChoices[1].name);
    expect(workcells.getIn(['0', 'workcell_id'])).to.equal(workcellDrawerChoices[1].id);
    const asyncTypeWorkcell = workcellDrawerChoices.filter((wc) => wc.name === workcells.getIn(['1', 'name']));
    expect(_.isEmpty(asyncTypeWorkcell)).to.be.true;
  });

  it('should download zip file when the workcell is of integration type', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb('binary-zip', undefined, { getResponseHeader: () => 'attachment;filename="zip";filename=*"zip"' });
        return { fail: () => ({ always: () => {} }) };
      }
    });
    sandbox.stub(WorkcellStore, 'getByWorkcellId').returns(workcells.get(1));
    const fileToBlob = sandbox.stub(FileUtil, 'base64ToBlob');
    const downloadBlob = sandbox.stub(FileUtil, 'downloadBlob');
    const primeDirective = page.find(PrimeDirective);
    primeDirective.instance().selectForWorkcell(immutableTestRun.getIn(['instructions', '0']), {});
    page.update();
    const sendToWorkcell = page.find('SendToWorkcellDrawer').props().onSchedule;
    sendToWorkcell(workcells.getIn(['0', 'workcell_id']));
    expect(post.calledOnce).to.be.true;
    expect(fileToBlob.calledOnce).to.be.true;
    expect(downloadBlob.calledOnce).to.be.true;
    expect(fileToBlob.getCall(0).args[1]).to.be.equal('zip');
  });
});

describe('PrimeDirectivePage - instructions complete test', () => {
  const sandbox = sinon.createSandbox();
  let page;
  let confirmWithUserStub;

  beforeEach(async () => {
    confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE).returns(true);
    page = await mountPage({ allowManual: true });
  });

  afterEach(() => {
    page.unmount();
    sandbox.restore();
  });

  it('should enable mark all complete button when allow manual button is clicked', async () => {
    let primeDirective = page.find(PrimeDirective);
    primeDirective.state().allowManual = false;
    await setStatePromise(page, primeDirective.state());
    primeDirective = page.find(PrimeDirective);
    let markAllCompleteButton = primeDirective.find('ButtonGroup').find('Button').at(2);
    expect(markAllCompleteButton.props().disabled).to.be.true;
    const allowManualButton = primeDirective.find('ButtonGroup').find('Button').at(0);
    allowManualButton.simulate('click');
    primeDirective = page.find(PrimeDirective);
    markAllCompleteButton = primeDirective.find('ButtonGroup').find('Button').at(2);
    expect(markAllCompleteButton.props().disabled).to.be.false;
  });

  it('should start complete all when user clicks mark all complete button', async () => {
    confirmWithUserStub.returns(true);
    const primeDirective = page.find(PrimeDirective);
    const completeAllSpy = sandbox.spy(primeDirective.instance(), 'completeAll');
    const markAllCompleteButton = primeDirective.find('ButtonGroup').find('Button').at(2);
    markAllCompleteButton.simulate('click');

    expect(completeAllSpy.calledOnce).to.be.true;
    expect(primeDirective.state().isMarkAllCompleteInProgress).to.be.true;
    expect(primeDirective.state().completionSnapshot.nextToComplete).to.equal('i1aey3utswx6n');
    primeDirective.state().isMarkAllCompleteInProgress = false;
    await setStatePromise(page, primeDirective.state());
  });

  it('should load workCells when user has VIEW_DEVICES feature', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').returns(true);
    const primeDirective = page.find(PrimeDirective);
    const loadWorkCellSpy = sandbox.spy(WorkcellActions, 'loadWorkcellsByLabId');
    primeDirective.instance().fetchWorkcells();
    expect(loadWorkCellSpy.calledOnce).to.be.true;
  });

  it('should not load workCells when user does not have VIEW_DEVICES feature', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').returns(false);
    const primeDirective = page.find(PrimeDirective);
    const loadWorkCellSpy = sandbox.spy(WorkcellActions, 'loadWorkcellsByLabId');
    primeDirective.instance().fetchWorkcells();
    expect(loadWorkCellSpy.calledOnce).to.be.false;
  });

  it('should start on first incomplete instruction when user clicks mark all complete button', async () => {
    confirmWithUserStub.returns(true);
    const completedInstructions = testRun.instructions.map((ins, idx) => {
      if (idx < 2) {
        ins.completed_at = new Date().toISOString();
      }
      return ins;
    });

    const primeDirective = page.find(PrimeDirective);
    const completeAllSpy = sandbox.spy(primeDirective.instance(), 'completeAll');
    const updatedInstructionGroups = groupInstructions(Immutable.fromJS(completedInstructions));
    primeDirective.state().instructionGroups = updatedInstructionGroups;
    await setStatePromise(page, primeDirective.state());
    const markAllCompleteButton = primeDirective.find('ButtonGroup').find('Button').at(2);
    markAllCompleteButton.simulate('click');
    expect(primeDirective.find('HeaderRow').at(0).props().complete).to.be.false;
    expect(completeAllSpy.calledOnce).to.be.true;
    expect(primeDirective.state().completionSnapshot.nextToComplete).to.equal('i1aey3uttjqx8');
    primeDirective.state().isMarkAllCompleteInProgress = false;
    await setStatePromise(page, primeDirective.state());
  });

  it('should not start complete all when all instructions are completed', async () => {
    confirmWithUserStub.returns(true);
    const completedInstructions = testRun.instructions.map(ins => {
      ins.completed_at = new Date().toISOString();
      return ins;
    });
    const primeDirective = page.find(PrimeDirective);
    const updatedInstructionGroups = groupInstructions(Immutable.fromJS(completedInstructions));
    primeDirective.state().instructionGroups = updatedInstructionGroups;
    await setStatePromise(page, primeDirective.state());
    const markAllCompleteButton = primeDirective.find('ButtonGroup').find('Button').at(2);
    markAllCompleteButton.simulate('click');
    expect(primeDirective.state().isMarkAllCompleteInProgress).to.be.false;
  });

  it('should set page header as primary type by default', async () => {
    page = await mountPage();
    let primeDirective = page.find(PrimeDirective);
    primeDirective.state().run = Immutable.fromJS(testRun);
    await setStatePromise(page, primeDirective.state());
    primeDirective = page.find(PrimeDirective);
    expect(page.find('PageHeader').props().type).to.equal('primary');
  });
});

describe('PrimeDirectivePage - instructions export csv test', () => {
  const sandbox = sinon.createSandbox();
  let page;

  beforeEach(() => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE).returns(true);
  });

  afterEach(() => {
    page.unmount();
    sandbox.restore();
  });

  it('should enable the export csv button when atleast one instruction has a csv file linked to it', async () => {
    const runWithInstructionESA = { ...testRun };
    runWithInstructionESA.instructions[0].generates_execution_support_artifacts = true;
    page = await mountPage();
    let primeDirective = page.find(PrimeDirective);
    primeDirective.state().run = Immutable.fromJS(runWithInstructionESA);
    await setStatePromise(page, primeDirective.state());
    primeDirective = page.find(PrimeDirective);
    const exportCSVButton = primeDirective.find('ButtonGroup').find('Button').at(3);

    expect(exportCSVButton.length).to.equal(1);
    expect(exportCSVButton.props().disabled).to.be.false;
    expect(exportCSVButton.children().text()).to.equal('Export csv');
  });

  it('should trigger ModalActions open when export csv button is clicked', async () => {
    const runWithInstructionESA = { ...testRun };
    runWithInstructionESA.instructions[0].generates_execution_support_artifacts = true;
    const modalOpenSpy = sinon.spy(ModalActions, 'open');
    page = await mountPage();
    let primeDirective = page.find(PrimeDirective);
    primeDirective.state().run = Immutable.fromJS(runWithInstructionESA);
    await setStatePromise(page, primeDirective.state());
    primeDirective = page.find(PrimeDirective);
    const exportCSVButton = primeDirective.find('ButtonGroup').find('Button').at(3);
    exportCSVButton.simulate('click');

    expect(modalOpenSpy.calledOnceWithExactly(ExportCSVModal.MODAL_ID)).to.be.true;
  });

  it('should disable the export csv button when none of the instructions have linked csv file', async () => {
    page = await mountPage();
    const primeDirective = page.find(PrimeDirective);
    const exportCSVButton = primeDirective.find('ButtonGroup').find('Button').at(3);

    expect(exportCSVButton.length).to.equal(1);
    expect(exportCSVButton.props().disabled).to.be.true;
  });

  it('should indicate when project is an implementation project', async () => {
    const runWithImplementationProject = { ...testRun };
    runWithImplementationProject.project.is_implementation = true;
    page = await mountPage();
    let primeDirective = page.find(PrimeDirective);
    primeDirective.state().run = Immutable.fromJS(runWithImplementationProject);
    await setStatePromise(page, primeDirective.state());
    primeDirective = page.find(PrimeDirective);
    expect(page.find('PageHeader').props().type).to.equal('brand');
    expect(primeDirective.find('ImplementationProjectIndicator').length).to.equal(1);
  });
});
