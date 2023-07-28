import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import FilterSidebar from 'main/pages/RunsPage/views/CalenderView/FilterSidebar';
import StoresContext, { makeNewContext } from 'main/stores/mobx/StoresContext';
import UserActions from 'main/actions/UserActions';
import FeatureStore from 'main/stores/FeatureStore';
import { MultiSelect } from '@transcriptic/amino';

describe('FilterSidebar', () => {
  const sandbox = sinon.createSandbox();
  const operators = Immutable.fromJS([
    {
      id: 'operator_id_1',
      name: 'operator_name_1'
    },
    {
      id: 'operator_id_2',
      name: 'operator_name_2'
    }
  ]);

  const props = {
    labsOptions: [{
      name: 'Menlo Park',
      value: 'lb1'
    },
    {
      name: 'San Diego',
      value: 'lb2'
    }],
    showOrgFilter: false
  };

  const consumerObj =   {
    id: 'lc123',
    lab_id: 'lb33',
    organization_id: 'org13',
    organization_name: 'name',
    organization_group: 'qwe',
  };

  let wrapper;
  let wrapperContext;

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    sandbox.stub(UserActions, 'loadUsers').returns(operators);
  });

  afterEach(() => {
    wrapper = undefined;
    if (wrapperContext) {
      wrapperContext.unmount();
    }
    sandbox.restore();
  });

  function CalendarViewWithContext({ stores, ...props }) {
    return (
      <StoresContext.Provider value={stores}>
        <FilterSidebar {...props} />
      </StoresContext.Provider>
    );
  }

  const mount = (workunits, statuses) => {
    const storesContext = makeNewContext();
    storesContext.calendarViewStore.isLoaded = true;
    storesContext.runFilterStore.updateLabId('lb1');
    storesContext.runFilterStore.updateSelectedOperators(['all', 'unassigned'].map(e => ({ name: e, value: e })));
    storesContext.runFilterStore.updateSelectedOrg({ name: 'org', value: 'org13' });
    storesContext.labStore.labConsumers.merge(Object.entries({ labId: [consumerObj] }));
    storesContext.labStore.workunitsByLabId.merge([['lb1', workunits || WORKUNIT_PAYLOAD]]);
    storesContext.calendarViewStore.runSchedules = RUNSCHEDULE_PAYLOAD;
    storesContext.calendarViewStore.statuses = statuses;
    storesContext.calendarViewStore.resetStatuses();
    wrapperContext = enzyme.mount(<CalendarViewWithContext stores={storesContext} {...(props)} />);
    wrapper = wrapperContext.find(FilterSidebar);
  };

  it('should have inline calender', () => {
    mount();
    const datePicker = wrapper.find('DatePicker');
    expect(datePicker.exists()).to.be.true;
    expect(datePicker.prop('inline')).to.be.true;

  });

  it('should have Lab Dropdown', () => {
    mount();
    const operatorSection = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'LAB OPERATORS');
    const operatorFilter = operatorSection.find(MultiSelect);
    expect(operatorFilter).to.have.length(1);
    expect(operatorFilter.props().placeholder).to.equal('Select operators');
  });

  it('should not show `Device Set` when there are no workunits', () => {
    mount([]);
    const deviceSection = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'DEVICE SET');
    expect(deviceSection.length).to.equal(0);
    expect(wrapper.find('ColoredBulletList')).to.have.length(1);
  });

  it('should show `Device Set` when there are workunits', () => {
    const workunits = [{
      id: 'wu1fmsm55wa99rb',
      type: 'workunits',
      name: 'workunit2',
      color: 'rgba(204, 235, 197)'
    },
    {
      id: 'wu1fmsm55x8se56',
      type: 'workunits',
      name: 'workunit1',
      color: 'rgba(255, 237, 111)'
    }];
    mount(workunits);

    const deviceSection = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'DEVICE SET');
    expect(deviceSection.length).to.equal(1);
    expect(wrapper.find('ColoredBulletList')).to.have.length(2);
  });

  it('should present workunits colored bullet list with accurate props, when there are workunits', () => {
    const workunits = [{
      id: 'wu1fmsm55wa99rb',
      type: 'workunits',
      name: 'workunit2',
      color: 'rgba(204, 235, 197)'
    },
    {
      id: 'wu1fmsm55x8se56',
      type: 'workunits',
      name: 'workunit1',
      color: 'rgba(255, 237, 111)'
    }];
    mount(workunits);
    const coloredBulletList = wrapper.find('ColoredBulletList');
    expect(coloredBulletList.exists()).to.be.true;
    expect(coloredBulletList.first().prop('items').size).to.be.equal(workunits.length);
    expect(coloredBulletList.first().prop('items').get(0).get('id')).to.deep.equal(workunits[0].id);
  });

  it('should present status colored bullet list with accurate props', () => {
    const statuses = [
      { id: 'accepted', name: 'Waiting', enabled: true, color: 'rgba(255, 237, 111)' },
      { id: 'in_progress', name: 'Executing', enabled: true, color: 'rgba(204, 235, 197)' },
      { id: 'completed', name: 'Completed', enabled: false, color: 'rgba(188, 128, 189)' }
    ];
    mount(undefined, statuses);
    const coloredBulletList = wrapper.find('ColoredBulletList');
    expect(coloredBulletList.exists()).to.be.true;
    expect(coloredBulletList.at(0).prop('items').size).to.be.equal(statuses.length);
    expect(coloredBulletList.at(1).prop('items').get(0).get('id')).to.deep.equal(statuses[0].id);
  });

  it('should not show LabConsumersFilter, if showOrgFilter prop is not passed', () => {
    mount();
    const typeAhead = wrapper.find('LabConsumersFilter');
    expect(typeAhead).to.have.lengthOf(0);
  });

  it('should not show LabConsumersFilter, if showOrgFilter prop is passed', () => {
    props.showOrgFilter = true;
    mount();
    const typeAhead = wrapper.find('LabConsumersFilter');
    expect(typeAhead).to.have.lengthOf(1);
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
