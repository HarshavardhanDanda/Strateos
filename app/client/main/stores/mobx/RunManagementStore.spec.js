import { expect } from 'chai';
import sinon from 'sinon';

import ajax from 'main/util/ajax';
import { thennable } from 'main/util/TestUtil';
import { makeNewContext } from 'main/stores/mobx/StoresContext';
import { RunSubmitState, RunsViewType } from 'main/stores/mobx/RunManagementStore.ts';
import { getDefaultSearchPerPage } from 'main/util/List';

const run = (status, runId = 'runId') => ({
  id: runId,
  lab_id: 'lb1fej8nubpnurc',
  status,
  title: 'runTitle',
  total_cost: 'monies',
  protocol_id: 'protocolId',
});

const workcellsByLabIdMock = new Map([
  [
    'lb1fej8nubcf3k3',
    [
      {
        id: 'wc1esgannfju27r',
        workcell_id: 'wc4-frontend1',
        node_id: 'wc4-mcx1',
        is_test: false,
        name: 'wc4',
        region: 'tx',
        test_workcell: 'wc1fs98kqjycnvs',
        uri_base: 'lab.staging.strateos.com/haven',
        workcell_type: 'mcx',
        backend_address: null,
        created_at: '2020-08-20T12:01:30.000-07:00',
        updated_at: '2021-08-27T08:08:44.102-07:00'
      }
    ]
  ],
  [
    'lb1fej8nubpnurc',
    [
      {
        id: 'wc1esganngr6ccs',
        workcell_id: 'tst-01-frontend-01',
        node_id: 'tst-01-mcx-01',
        is_test: false,
        name: 'tst-01',
        region: 'sd',
        test_workcell: 'wc1fs98kqjycnvs',
        uri_base: 'lab.staging.strateos.com/studio',
        workcell_type: 'metamcx',
        backend_address: null,
        created_at: '2020-08-20T12:01:30.032-07:00',
        updated_at: '2021-07-23T14:06:36.338-07:00'
      }
    ]
  ]
]);

const accepted = 'accepted';
const allRuns = 'all_runs';
const inProgress = 'in_progress';
const pending = 'pending';

describe('RunManagementStore', () => {

  describe('allAcceptedOrInProgress', () => {
    const { runFilterStore, runManagementStore } = makeNewContext();
    const acceptedRun = run(accepted, 'acc1');
    const inProgressRun = run(inProgress, 'pro1');
    const pendingRun = run(pending, 'pen1');
    runManagementStore.setRuns([acceptedRun, inProgressRun, pendingRun], 1, 3);
    runFilterStore.updateRunStatus(allRuns);

    it('should be false if nothing is selected', () => {
      runManagementStore.setSelectedRuns({});
      expect(runManagementStore.allSelectedAcceptedOrInProgress).to.equal(false);
    });

    it('should be true when all runs are in either in progress or accepted status only', () => {
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      expect(runManagementStore.allSelectedAcceptedOrInProgress).to.equal(true);
    });

    it('should be false if any other status selected', () => {
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true, pen1: true });
      expect(runManagementStore.allSelectedAcceptedOrInProgress).to.equal(false);
    });
  });

  describe('Bulk submit selected runs', () => {
    const sandbox = sinon.createSandbox();
    const { runFilterStore, runManagementStore } = makeNewContext();
    let postStub, getStub;

    beforeEach(() => {
      runManagementStore.setRuns([run(accepted, 'acc1'), run(accepted, 'pro1'), run(accepted, 'pen1')], 1, 3);
      runFilterStore.updateRunStatus(accepted);
      postStub = sandbox.stub(ajax, 'post').returns({
        schedule_requests: [
          { id: 201, run_id: 'r12301', status_query_path: '/orgid/projectid/runs/r12301/schedule_requests/201' },
          { id: 202, run_id: 'r12302', status_query_path: '/orgid/projectid/runs/r12301/schedule_requests/202' }
        ]
      });

      getStub = sandbox.stub(ajax, 'get').returns({ status: 'success' });
    });

    afterEach(() => {
      if (sandbox) sandbox.restore();
    });

    it('should be false if nothing is selected', () => {
      runManagementStore.setSelectedRuns({});
      expect(runManagementStore.allSelectedAcceptedOrInProgress).to.equal(false);
    });

    it('should be true when runs are selected', () => {
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      expect(runManagementStore.allSelectedAcceptedOrInProgress).to.equal(true);
    });

    it('should call bulk submit request for metamcx work cell when bulkSubmitSelectedRuns is triggered', async () => {
      runManagementStore.labStore.workcellsByLabId.merge(workcellsByLabIdMock);
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      runManagementStore.setSelectedSubmitWorkcellId('tst-01-frontend-01');
      await runManagementStore.bulkSubmitSelectedRuns();
      expect(postStub.calledOnce).to.be.true;
      expect(getStub.called).to.be.true;
    });

    it('should not call bulk submit request for mcx work cell when bulkSubmitSelectedRuns is triggered', async () => {
      workcellsByLabIdMock.get('lb1fej8nubpnurc')[0].workcell_type = 'mcx';
      runManagementStore.labStore.workcellsByLabId.merge(workcellsByLabIdMock);
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      runManagementStore.setSelectedSubmitWorkcellId('tst-01-frontend-01');
      await runManagementStore.bulkSubmitSelectedRuns();
      expect(postStub.calledOnce).to.not.be.true;
    });

  });

  describe('Reset submit modal on selected runs', () => {
    const sandbox = sinon.createSandbox();
    const { runManagementStore } = makeNewContext();
    let loadRunPostStub;

    beforeEach(() => {
      loadRunPostStub = sandbox.stub(ajax, 'post').returns(thennable({
        num_pages: 1,
        per_page: getDefaultSearchPerPage(),
        results:
          [
            {
              id: 'r1av4qqjb5m2dq3a8',
              status: 'accepted',
              title: 'SomePlate on 2023-03-09',
              success: null
            },
            {
              id: 'r1av4qqjb5m2dq554',
              status: 'accepted',
              title: 'SomePlate on 2023-03-10',
              success: null
            },
          ]
      }));
    });

    afterEach(() => {
      if (sandbox) sandbox.restore();
    });

    it('should call load run request when resetSubmitModalOptions is triggered and submitModalState is Success', () => {
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      runManagementStore.setSelectedSubmitWorkcellId('tst-01-frontend-01');
      runManagementStore.viewType = RunsViewType.Queue;
      runManagementStore.submitModalState = RunSubmitState.Success;
      runManagementStore.resetSubmitModalOptions();
      expect(loadRunPostStub.calledOnce).to.be.true;
    });

    it('should not call load run request when resetSubmitModalOptions is triggered and submitModalState is not Success', () => {
      runManagementStore.setSelectedRuns({ acc1: true, pro1: true });
      runManagementStore.setSelectedSubmitWorkcellId('tst-01-frontend-01');
      runManagementStore.viewType = undefined;
      runManagementStore.resetSubmitModalOptions();
      expect(loadRunPostStub.calledOnce).to.not.be.true;
    });
  });

});
