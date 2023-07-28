import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import CalenderView from 'main/pages/RunsPage/views/CalenderView';
import StoresContext, { makeNewContext } from 'main/stores/mobx/StoresContext';

describe('CalenderView', () => {
  const sandbox = sinon.createSandbox();
  let wrapperContext;
  let wrapper;

  function CalendarViewWithContext({ stores }) {
    return (
      <StoresContext.Provider value={stores}>
        <CalenderView  />
      </StoresContext.Provider>
    );
  }

  const mount = () => {
    const storesContext = makeNewContext();
    storesContext.calendarViewStore.isLoaded = true;
    storesContext.labStore.workunitsByLabId.merge([['lb1', WORKUNIT_PAYLOAD]]);
    storesContext.calendarViewStore.runSchedules = RUNSCHEDULE_PAYLOAD;
    storesContext.runFilterStore.updateLabId('lb1');
    storesContext.runFilterStore.updateSelectedOperators(['all', 'unassigned'].map(e => ({ name: e, value: e })));
    storesContext.runFilterStore.updateSelectedOrg({ name: 'org', value: 'org13' });
    storesContext.labStore.labConsumers.merge(Object.entries({ labId: [consumerObj] }));
    storesContext.calendarViewStore.resetStatuses();
    wrapperContext = enzyme.mount(<CalendarViewWithContext stores={storesContext} />);
    wrapper = wrapperContext.find(CalenderView);
  };

  afterEach(() => {
    wrapper = undefined;
    if (wrapperContext) {
      wrapperContext.unmount();
    }
    sandbox.restore();
  });

  it('should render', () => {
    mount();
  });

  it('should have calendar', () => {
    mount();
    expect(wrapper.find('Calendar').length).to.equal(1);
  });

  it('should have FilterSideBar ', () => {
    mount();
    expect(wrapper.find('FilterSidebar').length).to.equal(1);
  });

  it('should generate events from Runschedules ', () => {
    mount();
    const events = wrapper.find('Calendar').props().events;
    expect(events[0].id).to.equal(RUNSCHEDULE_PAYLOAD[0].id);
    expect(events[0].title).to.equal(RUNSCHEDULE_PAYLOAD[0].run_title);
    expect(events[0].entity_id).to.equal(RUNSCHEDULE_PAYLOAD[0].run_id);
  });

});

const WORKUNIT_PAYLOAD = [
  {
    id: 'wu1fhz98bshkdcc',
    enabled: true
  },
  {
    id: 'wu1fhz98br7q9p7',
    enabled: true
  },
  {
    id: 'wu1fhz98bsbwdq7',
    enabled: true
  }
];

const RUNSCHEDULE_PAYLOAD = [
  {
    end_date_time: '2021-05-08T07:59:13.000-07:00',
    id: 'rs1fpy3a68738xk',
    run_id: 'r1eh44z2yrcja6',
    run_status: 'accepted',
    run_title: 'qPCR assay',
    start_date_time: '2021-05-06T12:59:13.000-07:00',
    work_unit_id: 'wu1fhz98bsbwdq7',
    run_operator_id: 'u17pfuad5pywf',
    run_priority: 'Low',
    enabled: true
  }
];

const consumerObj =   {
  id: 'lc123',
  lab_id: 'lb33',
  organization_id: 'org13',
  organization_name: 'name',
  organization_group: 'qwe',
};
