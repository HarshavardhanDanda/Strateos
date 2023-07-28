import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import RunScheduleActions from 'main/actions/RunScheduleActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import WorkUnitActions  from 'main/actions/WorkUnitActions';
import WorkcellActions  from 'main/actions/WorkcellActions';
import UserPreference from 'main/util/UserPreferenceUtil';
import ApprovalModal from 'main/pages/RunsPage/views/ApprovalsView/ApprovalModal';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { threadBounce } from 'main/util/TestUtil';
import SessionStore from 'main/stores/SessionStore';
import { DatePicker, Table } from '@transcriptic/amino';
import Moment from 'moment';

describe('Approval Modal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const currentDate = new Date();
  const requestedDateTime = new Date(currentDate);
  requestedDateTime.setHours(currentDate.getHours() + 3);

  const isDayBoundry = (dateToCheck) => {
    const dateAfterOneMin = new Date(dateToCheck);
    dateAfterOneMin.setMinutes(dateToCheck.getMinutes() + 1);
    const _isDayBoundry = Moment(dateAfterOneMin).isAfter(Moment(dateToCheck), 'date');
    return _isDayBoundry;
  };

  if (isDayBoundry(requestedDateTime)) {
    requestedDateTime.setMinutes(requestedDateTime.getMinutes() + 1);
  }

  const amsWorkcells =
    { content:
      [
        {
          id: 'test_workcell_1',
          name: 'workcell1',
          labId: 'test_lab_1'
        }
      ]
    };

  const run = {
    id: 'r1ehezhnmykpf8',
    title: 'Test1',
    status: 'accepted',
    'billing_valid?': true,
    unrealized_input_containers_count: 0,
    pending_shipment_ids: [],
    total_cost: '29.63',
    created_at: '2021-04-28 13:27:41.786944',
    requested_at: requestedDateTime,
    lab_id: 'test_lab_1',
    assigned_to_id: 'Test Bot 1'
  };

  const allRunSchedules = [
    { data:
      [
        {
          id: 'rs1fpy3a68738xk',
          attributes: {
            run_id: run.id,
            run_title: run.title,
            run_status: run.status,
            work_unit_id: 'wu1fhz98bsbwdq7',
            start_date_time: '2021-05-06T12:59:13.000-07:00',
            end_date_time: '2021-05-08T07:59:13.000-07:00'
          }
        },
        {
          id: 'rs1fpy3a68r47w3',
          attributes: {
            run_id: run.id,
            run_title: run.title,
            run_status: run.status,
            work_unit_id: 'wu1fhz98br7q9p7',
            start_date_time: '2021-05-07T05:59:13.000-07:00',
            end_date_time: '2021-05-08T10:59:13.000-07:00'
          }
        },
        {
          id: 'rs1fkp2kg4am8kc',
          attributes: {
            run_id: 'r16rrgyymvphf',
            run_title: 'Different run',
            run_status: 'accepted',
            work_unit_id: 'wu1fhz98br7q9p7',
            start_date_time: '2021-05-07T05:59:13.000-07:00',
            end_date_time: '2021-05-08T10:59:13.000-07:00'
          }
        }
      ]

    }];

  const allWorkUnits = [
    { data:
      [
        {
          id: 'wu1fhz98br7q9p7',
          attributes: {
            name: 'work_unit_1'
          }
        },
        {
          id: 'wu1fhz98bsbwdq7',
          attributes: {
            name: 'work_unit_2'
          }
        }
      ]

    }];

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  let mockLoadRunSchedules;
  beforeEach(() => {
    mockLoadRunSchedules = sandbox.stub(RunScheduleActions, 'loadRunSchedules').returns({
      done: (cb) => {
        cb(allRunSchedules);
        return { fail: () => ({}) };
      }
    }
    );
    sandbox.stub(UserPreference, 'get');
    sandbox.stub(UserPreference, 'save');
    sandbox.stub(WorkUnitActions, 'loadWorkUnitsByLabId').returns({
      done: (cb) => {
        cb(allWorkUnits);
        return { fail: () => ({}) };
      }
    });
  });

  const props = {
    run: run,
    runApprove: sandbox.stub(),
    modalType: 'schedule'
  };

  it('should have title as `Run schedule`, when modalType is `schedule` ', () => {
    wrapper = shallow(<ApprovalModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.equal('Run schedule');
  });

  it('should have accept text as `Save`, when modalType is `schedule` ', () => {
    wrapper = shallow(<ApprovalModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptText).to.equal('Save');
  });

  it('should show run details like title, submitted state when modalType is not `schedule`', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    wrapper = shallow(<ApprovalModal {...props} modalType="Approval" />);
    expect(wrapper.find('KeyValueList').at(0).props().entries[0].key).to.equal('Name');
    expect(wrapper.find('KeyValueList').at(0).props().entries[0].value).to.equal('Test1');
    expect(wrapper.find('KeyValueList').at(1).props().entries[0].key).to.equal('Submitted');
    const dataTime = wrapper.find('KeyValueList').at(1).props().entries[0].value;
    expect(dataTime.props.timestamp).to.include('2021-04-28');
  });

  it('should not show run-details, operator dropdown, Priority dropdown, when modalType is `schedule` ', () => {
    wrapper = shallow(<ApprovalModal {...props} />);
    expect(wrapper.find('KeyValueList').length).to.equal(0);
    expect(wrapper.find('.priority-dropdown')).to.have.length(0);
    expect(wrapper.find('.operator-dropdown')).to.have.length(0);
  });

  it('should show run-details, operator dropdown, Priority dropdown, when modalType is `schedule` ', () => {
    wrapper = shallow(<ApprovalModal {...props} modalType="Approval" />);
    expect(wrapper.find('KeyValueList').length).to.equal(3);
    expect(wrapper.find('.priority-dropdown')).to.have.length(1);
    expect(wrapper.find('.operator-dropdown')).to.have.length(1);
  });

  it('should have scheduling and should pass run if user has valid feature flag', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);

    expect(wrapper.find('Schedule')).to.have.length(1);
    expect(wrapper.find('Schedule').props().run).to.equal(run);
  });

  it('should not have scheduling if user has invalid feature flag', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(false);
    wrapper = shallow(<ApprovalModal {...props} />);
    expect(wrapper.find('Schedule')).to.have.length(0);
  });

  it('should have scheduling zero state if run schedules are empty', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);

    expect(wrapper.find('Schedule').dive().find('ZeroState')).to.exist;
  });

  it('should pass workunits to Schedule to show in the workunit dropdown', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);
    wrapper.find('Schedule').dive();

    const expectedWorkUnitIds = allWorkUnits[0].data.map(wu => wu.id);
    const actualWorkUnitIds = wrapper.find('Schedule').props().workunits.map(wu => wu.value);
    expect(expectedWorkUnitIds.toString()).to.equal(actualWorkUnitIds.toString());
  });

  it('should pass workcells of AMS along with other workunits to Schedule to show in the workunit dropdown', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    sandbox.stub(SessionStore, 'hasFeature').withArgs('AMS_enabled').returns(true);
    const workcellStub = sandbox.stub(WorkcellActions, 'fetchWorkcellsFromAMS').returns({ done: (cb) => {
      cb(amsWorkcells);
    } });

    wrapper = shallow(<ApprovalModal {...props} />);
    wrapper.find('Schedule').dive();

    expect(workcellStub.called).to.be.true;
    const actualWorkUnitIds = wrapper.find('Schedule').props().workunits.map(wu => wu.value);
    expect(actualWorkUnitIds.toString()).to.include(amsWorkcells.content[0].id);
  });

  it('should not pass workcells of AMS along with other workunits to Schedule if AMS_enabled feature is not available in current org', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    sandbox.stub(SessionStore, 'hasFeature').withArgs('AMS_enabled').returns(false);
    const workcellStub = sandbox.stub(WorkcellActions, 'fetchWorkcellsFromAMS').returns({ done: (cb) => {
      cb(amsWorkcells);
    } });

    wrapper = shallow(<ApprovalModal {...props} />);
    wrapper.find('Schedule').dive();

    expect(workcellStub.called).to.be.false;
    const actualWorkUnitIds = wrapper.find('Schedule').props().workunits.map(wu => wu.value);
    expect(actualWorkUnitIds.toString()).not.to.include(amsWorkcells.content[0].id);
  });

  it('should pass schedules of current run to Schedule', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);
    wrapper.find('Schedule').dive();

    const expectedRunScheduleIds = allRunSchedules[0].data.filter(rs => rs.attributes.run_id === run.id).map(rs => rs.id);
    const actualRunScheduleIds =  wrapper.find('Schedule').props().runSchedule.map(rs => rs.id);
    expect(expectedRunScheduleIds.toString()).to.equal(actualRunScheduleIds.toString());
  });

  it('should pass schedules of selected workunits to Schedule to show it in calendar', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);

    wrapper.find('Schedule').dive();
    const selectedWorkUnits = allRunSchedules[0].data.filter(rs => rs.attributes.run_id === run.id).map(rs => rs.attributes.work_unit_id);
    const actualRunScheduleIds = allRunSchedules[0].data.filter(rs => selectedWorkUnits.includes(rs.attributes.work_unit_id))
      .map(rs => rs.id);

    const expectedRunScheduleIds = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.id);
    expect(expectedRunScheduleIds.toString()).to.equal(actualRunScheduleIds.toString());
  });

  it('should pass the new event to `Schedule Component` to show it in the calendar whenever a run schedule is added', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);

    wrapper.find('Schedule').dive();

    let actualRunScheduleIds = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.id);
    expect(3).to.equal(actualRunScheduleIds.length);

    // adding a run_schedule
    wrapper.find('Schedule').props().addDevice();

    actualRunScheduleIds = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.id);
    expect(4).to.equal(actualRunScheduleIds.length);

    // adding a run_schedule
    wrapper.find('Schedule').props().addDevice();

    actualRunScheduleIds = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.id);
    expect(5).to.equal(actualRunScheduleIds.length);
  });

  it('should pass the updated event to `Schedule Component` to show it in the calendar whenever a run schedule is updated', () => {
    const updatedDate = new Date(2021, 6, 22);
    const rowIndex = 0;
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    wrapper = shallow(<ApprovalModal {...props} />);

    wrapper.find('Schedule').dive();

    let actualRunScheduleStartTime = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.start);
    expect(updatedDate.getDate()).not.equal(actualRunScheduleStartTime[rowIndex].getDate());

    // updating a run_schedule
    wrapper.find('Schedule').props().updateRunSchedule('schedule_date', updatedDate, rowIndex);

    actualRunScheduleStartTime = wrapper.find('Schedule').props().currentRunSchedules.map(rs => rs.start);
    expect(updatedDate.getDate()).to.equal(actualRunScheduleStartTime[rowIndex].getDate());
  });

  it('should sort operators', async () => {
    const expectedOrder = ['Bar', 'Foo', 'operator'];
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    const userActions = sandbox.stub(UserActions, 'loadUsers');
    userActions.returns(Promise.resolve([{ id: '1', name: 'Foo' }, { id: '2', name: 'Bar' }, { id: '3', name: 'operator' }]));
    sandbox.stub(AccessControlActions, 'loadPermissions').returns(Promise.resolve([]));

    wrapper = shallow(
      <OperatorsFilter
        {...props}
        labIds={[1, 2, 3]}
        selectedIds={[1, 2, 3]}
      />);
    await threadBounce(5);
    wrapper.update().state().operators.forEach(({ name }, i) => expect(name).to.equal(expectedOrder[i]));
  });

  it('should have custom operator dropdown option as Assign to Me', () => {
    wrapper = shallow(<ApprovalModal {...props} modalType="Approval" userId="current-userid" />);
    expect(wrapper.find(OperatorsFilter)).to.have.length(1);
    expect(wrapper.find(OperatorsFilter).props().customOperatorOptions).to.deep.equal([{ value: 'current-userid', name: 'Assign to Me' }]);
  });

  it('should allow Strateos lab managers to see add device button to add multiple workcells', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    getACS.withArgs(FeatureConstants.MULTI_DEVICE_RUN_SCHEDULE).returns(true);

    wrapper = shallow(<ApprovalModal {...props} />);
    const addDeviceSetButton = wrapper.find('Schedule').dive().find('ZeroState').dive();
    addDeviceSetButton.find('Button').at(0).simulate('click');
    wrapper.update();
    expect(wrapper.find('Schedule').dive().find('Button').at(0)
      .dive()
      .text()).to.equal(' Add Device');
  });

  it('should not allow CCS lab managers to see add device button to add multiple workcells', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    getACS.withArgs(FeatureConstants.MULTI_DEVICE_RUN_SCHEDULE).returns(false);

    wrapper = shallow(<ApprovalModal {...props} />);
    const addDeviceSetButton = wrapper.find('Schedule').dive().find('ZeroState').dive();
    addDeviceSetButton.find('Button').at(0).simulate('click');
    wrapper.update();
    expect(wrapper.find('Schedule').dive().find('Button').exists()).to.be.false;
  });

  it('should set scheduling date and time correctly when run requested date and time is provided', () => {
    mockLoadRunSchedules.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    getACS.withArgs(FeatureConstants.MULTI_DEVICE_RUN_SCHEDULE).returns(true);

    sandbox.stub(RunScheduleActions, 'loadRunSchedules').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    }
    );

    wrapper = shallow(<ApprovalModal {...props} />);
    const addDeviceSetButton = wrapper.find('Schedule').dive().find('ZeroState').dive();
    addDeviceSetButton.find('Button').at(0).simulate('click');
    wrapper.update();

    const schedulingTable = wrapper.find('Schedule').dive().find(Table).dive();
    const actualDate = Moment(schedulingTable.find(DatePicker).at(0).prop('date'));

    const actualScheduledTime = Moment(schedulingTable.find(DatePicker).at(1).prop('date'));

    expect(actualDate.isSame(Moment(requestedDateTime), 'date')).to.be.true;
    const scheduledHour = actualScheduledTime
      .hour();

    const requestedHour = Moment(requestedDateTime).hour();
    // when requested time more than 23:30 , schedule time round off to 00: 00
    if (requestedHour !== 23 && scheduledHour !== 0) {
      expect(scheduledHour >= requestedHour).to.be.true;
    }
  });

  it('should set scheduling date and time correctly when run requested date and time is not provided', () => {
    mockLoadRunSchedules.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(true);
    getACS.withArgs(FeatureConstants.MULTI_DEVICE_RUN_SCHEDULE).returns(true);

    sandbox.stub(RunScheduleActions, 'loadRunSchedules').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    }
    );

    wrapper = shallow(<ApprovalModal run={{ ...run, requested_at: null }} />);
    const addDeviceSetButton = wrapper.find('Schedule').dive().find('ZeroState').dive();
    addDeviceSetButton.find('Button').at(0).simulate('click');
    wrapper.update();

    const schedulingTable = wrapper.find('Schedule').dive().find(Table).dive();
    const actualDate = Moment(schedulingTable.find(DatePicker).at(0).prop('date'));

    const actualScheduledTime = Moment(schedulingTable.find(DatePicker).at(1).prop('date'));
    const scheduledHour = actualScheduledTime
      .hour();
    const currentHour = Moment().hour();

    if (!isDayBoundry(actualDate.toDate())) {
      expect(actualDate.isSame(Moment(), 'date')).to.be.true;
    }
    if (currentHour !== 23 && scheduledHour !== 0) {
      expect(scheduledHour >= currentHour).to.be.true;
    }
  });

  it('should update the run state and render correctly when run prop is updated', () => {
    wrapper = shallow(<ApprovalModal {...props} modalType="approval" />);
    let keyValueList = wrapper.find('KeyValueList');
    expect(keyValueList.at(0).prop('entries')[0].value).to.equal(props.run.title);
    expect(wrapper.find('Select').prop('value')).to.equal('Medium');
    expect(wrapper.find('OperatorsFilter').prop('singleSelectId')).deep.equal(['Test Bot 1']);

    wrapper.setProps({ ...props, run: { ...run, title: 'New Run Title', priority: 'High', assigned_to_id: 'Test Bot 2' }, modalType: 'approval' });
    keyValueList = wrapper.find('KeyValueList');
    expect(keyValueList.at(0).prop('entries')[0].value).to.equal('New Run Title');
    expect(wrapper.find('Select').prop('value')).to.equal('High');
    expect(wrapper.find('OperatorsFilter').prop('singleSelectId')).deep.equal(['Test Bot 2']);
  });

  it('should not update the run state when run prop is not updated', () => {
    wrapper = shallow(<ApprovalModal {...props} modalType="approval" />);
    let keyValueList = wrapper.find('KeyValueList');
    expect(keyValueList.at(0).prop('entries')[0].value).to.equal(props.run.title);
    expect(wrapper.find('Select').prop('value')).to.equal('Medium');
    expect(wrapper.find('OperatorsFilter').prop('singleSelectId')).deep.equal(['Test Bot 1']);

    wrapper.setProps({ ...props, modalType: 'approval' });
    keyValueList = wrapper.find('KeyValueList');
    expect(keyValueList.at(0).prop('entries')[0].value).to.equal(props.run.title);
    expect(wrapper.find('Select').prop('value')).to.equal('Medium');
    expect(wrapper.find('OperatorsFilter').prop('singleSelectId')).deep.equal(['Test Bot 1']);
  });
});
