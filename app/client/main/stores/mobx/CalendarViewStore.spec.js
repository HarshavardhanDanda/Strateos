import { expect } from 'chai';
import sinon from 'sinon';
import { makeNewContext } from 'main/stores/mobx/StoresContext';
import RunScheduleActions from 'main/actions/RunScheduleActions';

describe('fetch options', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  const stubApiCalls = () => {
    const loadRunSchedulesStub = sandbox.stub(RunScheduleActions, 'loadRunSchedules').returns(runScheduleResponse);
    return loadRunSchedulesStub;
  };

  it('should call runSchedules', async () => {
    const { calendarViewStore } = makeNewContext();
    const loadRunSchedulesStub = stubApiCalls();
    calendarViewStore.resetStatuses();
    await calendarViewStore.onSearchOptionChange({
      labId: 'labId',
      manuallySelectedOperatorIds: ['unassigned'],
      selectedOrg: { name: 'og', value: 'org13' }
    });
    expect(loadRunSchedulesStub.calledOnce).to.be.true;
  });

  it('should persist runschdules', async () => {
    const { calendarViewStore } = makeNewContext();
    stubApiCalls();
    calendarViewStore.resetStatuses();
    await calendarViewStore.onSearchOptionChange({
      labId: 'labId',
      manuallySelectedOperatorIds: ['unassigned'],
      selectedOrg: { name: 'og', value: 'org13' }
    });
    expect(calendarViewStore.runScheduleList.id).to.be.equals(runScheduleResponse[0].data.id);
  });

});

const runScheduleResponse = [
  {
    data: [
      {
        type: 'run_schedules',
        attributes: {
          end_date_time: '2021-05-08T07:59:13.000-07:00',
          id: 'rs1fpy3a68738xk',
          run_id: 'r1eh44z2yrcja6',
          run_status: 'accepted',
          run_title: 'qPCR assay',
          start_date_time: '2021-05-06T12:59:13.000-07:00',
          work_unit_id: 'wu1fhz98bsbwdq7',
          run_operator_id: 'u17pfuad5pywf',
          run_priority: 'Low'
        },
        id: 'rs1fpy3a68738xk'
      }]
  }
];
