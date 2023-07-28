import _          from 'lodash';
import React      from 'react';
import uuidv4     from 'uuid/v4';
import Moment     from 'moment';
import Immutable  from 'immutable';
import { SinglePaneModal } from 'main/components/Modal';
import './ApprovalModal.scss';
import { Button, LabeledInput, Select, DateTime, KeyValueList, Section } from '@transcriptic/amino';
import { getColorMap } from 'main/util/ColorMap.js';
import RunScheduleActions from 'main/actions/RunScheduleActions';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';
import WorkUnitActions from 'main/actions/WorkUnitActions';
import WorkcellActions from 'main/actions/WorkcellActions';
import SessionStore    from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import Schedule from './Schedule';

const dateStringFormatter = (date) => {
  let dateString = '';
  if (date) {
    dateString = <DateTime timestamp={(date)} />;
  }
  return dateString;
};

const getDiffHours = (date1, date2) => {
  const diffHours = (Moment.duration(Moment(date1).diff(Moment(date2)))).asHours();
  if (Number.isInteger(diffHours)) { return diffHours; }
  return diffHours.toFixed(2);
};

class ApprovalModal extends React.Component {

  static get MODAL_ID() {
    return 'APPROVAL_MODAL';
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (!_.isEqual(nextProps.run, prevState.run)) {
      return {
        run: nextProps.run,
        priority: nextProps.run ? nextProps.run.priority ? nextProps.run.priority : 'Medium' : null,
        selectedOperatorId: nextProps.run ? nextProps.run.assigned_to_id ? [nextProps.run.assigned_to_id] : '' : ''
      };
    }
  }

  constructor(props) {
    super(props);
    this.state = this.defaultState();
    this.onPrioritySelect = this.onPrioritySelect.bind(this);
    this.onOperatorSelect = this.onOperatorSelect.bind(this);
    this.toggleOpen = this.toggleOpen.bind(this);
    this.deleteDevice = this.deleteDevice.bind(this);
    this.addDevice = this.addDevice.bind(this);
    this.fetchWorkUnitsAndRunschedules = this.fetchWorkUnitsAndRunschedules.bind(this);
    this.convertSecToHour = this.convertSecToHour.bind(this);
    this.updateRunSchedule = this.updateRunSchedule.bind(this);
    this.renderAddButton = this.renderAddButton.bind(this);
    this.getRunApproveRequest = this.getRunApproveRequest.bind(this);
    this.calculateMinTime = this.calculateMinTime.bind(this);
    this.calculateMaxTime = this.calculateMaxTime.bind(this);
    this.getScheduleDate = this.getScheduleDate.bind(this);
    this.fetchWorkcellsFromAMS = this.fetchWorkcellsFromAMS.bind(this);
  }

  defaultState() {
    return {
      run: undefined,
      priority: '',
      selectedOperatorId: '',
      isOpen: true,
      data: [],
      runSchedule: [],
      workunits: [],
      deleted_runSchedule: [],
      showEmptyDevice: true,
      selectedWorkUnits: [],
      allRunSchedules: [],
      earliestDate: new Date(),
      isLoading: false
    };
  }

  convertSecToHour(sec = 3600) {
    const hrs = (sec / (60 * 60));
    if (Number.isInteger(hrs)) { return hrs; }
    return hrs.toFixed(2);
  }

  updateRunSchedule(label, value, rowIndex) {
    this.setState(prevState => {
      const runSchedule = prevState.runSchedule;
      runSchedule[rowIndex][label] = value;

      if (label === 'workunit_id') this.updateSelectedWorkUnits(runSchedule);
      if (label === 'schedule_date') this.updateEarliestDate(runSchedule.map(schedule => schedule.schedule_date));
      return { runSchedule: runSchedule };
    });
  }

  clickRunId(run) {
    AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUN_DETAILS)
      ? this.props.history.push(`${run.run_status}/runs/${run.run_id}`) : '';
  }

  getIndexOfRunSchedule(currentSchedules, scheduleId) {
    for (let i = 0; i < currentSchedules.length; i++) {
      if (currentSchedules[i].id === scheduleId) return i;
    }
    return -1;
  }

  getWorkUnitColor(workunitId) {
    const { workunits } = this.state;
    const currentWorkUnit = workunits && workunits.filter(workunit => workunit.value === workunitId);
    return !_.isEmpty(currentWorkUnit) && currentWorkUnit[0].color;
  }

  getCurrentRunSchedules() {
    const { selectedWorkUnits, allRunSchedules, runSchedule } = this.state;
    const { run } = this.props;
    const currentRunSchedules = [];

    if (selectedWorkUnits && selectedWorkUnits.length > 0) {
      allRunSchedules && allRunSchedules.forEach(runSchedule => {
        if (selectedWorkUnits.includes(runSchedule.attributes.work_unit_id)) {
          const workunitColor = `${this.getWorkUnitColor(runSchedule.attributes.work_unit_id).slice(0, -1)}, 0.4)`;

          currentRunSchedules.push({
            id: runSchedule.id,
            entity_id: runSchedule.attributes.run_id,
            onClickEntityId: () => this.clickRunId(runSchedule.attributes),
            title: runSchedule.attributes.run_title || runSchedule.attributes.run_id,
            start: new Date(runSchedule.attributes.start_date_time),
            end: new Date(runSchedule.attributes.end_date_time),
            color: workunitColor
          });
        }
      });
    }

    if (runSchedule && runSchedule.length > 0) {
      const currentRunScheduleIds = currentRunSchedules.map(rs =>  rs.id);

      runSchedule.forEach(rs => {
        const startDate = new Date(rs.schedule_date);
        const timeObj = new Date(rs.schedule_time);
        startDate.setHours(timeObj.getHours());
        startDate.setMinutes(timeObj.getMinutes());

        if (currentRunScheduleIds.includes(rs.id)) {
          const index = this.getIndexOfRunSchedule(currentRunSchedules, rs.id);

          if (index !== -1) {
            currentRunSchedules[index].start = startDate;
            currentRunSchedules[index].end =  Moment(startDate).add(rs.run_time, 'h').toDate();
            currentRunSchedules[index].color = this.getWorkUnitColor(rs.workunit_id);
          }
        } else {
          currentRunSchedules.push({
            id: rs.id || uuidv4(),
            title: run ? (run.title || run.id) : '',
            start: startDate,
            end:  Moment(startDate).add(rs.run_time, 'h').toDate(),
            color: this.getWorkUnitColor(rs.workunit_id)
          });
        }
      });
    }

    return currentRunSchedules;
  }

  mergeResults(results) {
    const mergeResults = [];

    results.map((runSchedule) => runSchedule.data).forEach((data) => {
      // eslint-disable-next-line array-callback-return
      data.map((v) => {
        const ids = mergeResults.map(result => result.id);
        if (!ids.includes(v.id)) {
          mergeResults.push(v);
        }
      });
    });

    return mergeResults;
  }

  updateSelectedWorkUnits(runSchedule) {
    if (runSchedule) {
      const selectedWorkUnits = runSchedule.map(schedule => schedule.workunit_id).filter((value, index, workunits) => workunits.indexOf(value) === index);
      this.setState({ selectedWorkUnits });
    }
  }

  updateEarliestDate(dates) {
    if (dates) {
      const moments = dates.map(d => Moment(d));
      this.setState({ earliestDate: Moment.min(moments) });
    }
  }

  fetchWorkcellsFromAMS(labId) {
    const isAMSWorkcellsFetchable = SessionStore.hasFeature('AMS_enabled');
    if (isAMSWorkcellsFetchable) {
      WorkcellActions.fetchWorkcellsFromAMS(labId).done((workcells) => {
        if (!_.isEmpty(workcells)) {
          const workcellsByLab =   workcells.content.filter(workcell => workcell.labId === labId);
          const workcellIds = Immutable.fromJS(workcellsByLab.map(workcell => workcell.id));
          const colorMap = getColorMap(workcellIds);
          const finalWorkcellsData = workcellsByLab.map(workcellData => ({
            value: workcellData.id,
            name: workcellData.name,
            color: colorMap.get(workcellData.id)
          }));
          this.setState((prevState) => {
            return { workunits: prevState.workunits.concat(finalWorkcellsData) };
          });
        }
      });
    }
  }

  fetchWorkUnitsAndRunschedules(labId) {
    this.setState({ isLoading: true });
    WorkUnitActions.loadWorkUnitsByLabId(labId).done((result) => {
      const finalResults = this.mergeResults(result);
      const workunitIds = finalResults ? Immutable.fromJS(finalResults.map(workunit => workunit.id)) : [];
      const colorMap = getColorMap(workunitIds);
      const workunits = finalResults ? finalResults.map(workunitData => ({
        value: workunitData.id,
        name: workunitData.attributes.name,
        color: colorMap.get(workunitData.id)
      })) : [];
      this.setState({ workunits });
      this.fetchWorkcellsFromAMS(labId);
    });
    RunScheduleActions.loadRunSchedules({ lab_id: labId }).done((result) => {
      const { data } = this.state;

      const finalResults = this.mergeResults(result);
      const runSchedule = finalResults ? finalResults.filter(runScheduleData => runScheduleData.attributes.run_id === (this.props.run && this.props.run.id)).map(runScheduleData => ({
        workunit_id: runScheduleData.attributes.work_unit_id,
        run_id: runScheduleData.attributes.run_id,
        run_title: runScheduleData.attributes.run_title,
        id: runScheduleData.id,
        schedule_date: (new Date(runScheduleData.attributes.start_date_time)),
        run_time: getDiffHours(runScheduleData.attributes.end_date_time, runScheduleData.attributes.start_date_time),
        schedule_time: this.calculateStartTime((new Date(runScheduleData.attributes.end_date_time)), getDiffHours(runScheduleData.attributes.end_date_time, runScheduleData.attributes.start_date_time))
      })) : [];
      for (let i = 0; i < runSchedule.length; i++) { data.push(this.props.run); }
      if (runSchedule.length > 0) {

        this.setState(
          {
            runSchedule,
            data,
            showEmptyDevice: false
          });
      }

      this.updateSelectedWorkUnits(runSchedule);
      this.updateEarliestDate(runSchedule.map(schedule => schedule.schedule_date));
      this.setState({ allRunSchedules: finalResults, isLoading: false });
    });
  }

  calculateStartTime(date, hours) {
    return Moment(date).subtract(hours, 'h').toDate();
  }

  deleteDevice(rowIndex) {
    const { runSchedule, data, deleted_runSchedule } = this.state;
    if (runSchedule[rowIndex].id) {
      deleted_runSchedule.push(runSchedule[rowIndex].id);
      this.setState({ deleted_runSchedule });
    }

    runSchedule.splice(rowIndex, 1);
    data.splice(0, 1);
    this.updateSelectedWorkUnits(runSchedule);
    this.updateEarliestDate(runSchedule.map(schedule => schedule.schedule_date));
    this.setState({ runSchedule, data });
    if (runSchedule.length === 0) {
      this.setState({ showEmptyDevice: true });
    }
  }

  getRunApproveRequest() {
    const { selectedOperatorId, priority, runSchedule, deleted_runSchedule } = this.state;
    const { modalType } = this.props;
    let moments, minDate;

    for (let i = 0; i < runSchedule.length; i++) {
      const date = new Date(runSchedule[i].schedule_date);
      const timeObj = new Date(runSchedule[i].schedule_time);
      date.setHours(timeObj.getHours());
      date.setMinutes(timeObj.getMinutes());
      runSchedule[i].schedule_date = date;
      runSchedule[i].end_date_time = Moment(date).add(runSchedule[i].run_time, 'h').toDate();
    }

    if (runSchedule.length > 0) {
      moments = runSchedule.map(d => Moment(d.schedule_date));
      minDate = Moment.min(moments).toDate();
    }

    return {
      schedule_type: modalType,
      assigned_to_id: modalType === 'schedule' ? null : ((selectedOperatorId === '') ? null : selectedOperatorId),
      priority: modalType === 'schedule' ? null : priority,
      run_schedule: {
        data: runSchedule,
        deleted_runSchedule: deleted_runSchedule,
        schedule_start_date: minDate
      }
    };
  }

  onPrioritySelect(value) {
    this.setState({ priority: value });
  }

  onOperatorSelect(operator) {
    this.setState({ selectedOperatorId: operator });
  }

  toggleOpen() {
    this.setState(this.defaultState());
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  calculateMinTime(date) {
    const runTime = Moment(date);
    if (!runTime.isSame(Moment(), 'date') &&  runTime.isAfter(Moment())) {
      return runTime.startOf('day');
    }
    return Moment();
  }

  calculateMaxTime(date) {
    return Moment(date).endOf('day');
  }

  roundDateToNearestTimeInterval(date) {
    const minTime = this.calculateMinTime(date);
    const runTime = Moment(date);
    const selectedDate = runTime.isAfter(minTime) ? runTime : minTime;

    const minutes = selectedDate.minute();
    const remainder = (minutes === 0 || minutes === 30) ? 0 : 30 - (minutes % 30);
    return selectedDate.add(remainder, 'minutes').toDate();

  }

  getScheduleDate() {
    if (this.props.run && this.props.run.requested_at) {
      const date = new Date(this.props.run.requested_at);
      if (Moment(date).isSameOrAfter(Moment(), 'date')) {
        return date;
      }
    }
    return new Date();
  }

  addDevice() {
    const { data, runSchedule, workunits } = this.state;
    const { run } = this.props;

    const firstWorkUnit = workunits.length > 0 ? workunits[0].value : '';
    runSchedule.push({
      workunit_id: firstWorkUnit,
      run_time: (run && run.estimated_run_time) ? this.convertSecToHour(run.estimated_run_time) : this.convertSecToHour(),
      schedule_date: this.getScheduleDate(),
      schedule_time: this.roundDateToNearestTimeInterval((run && run.requested_at && new Date(run.requested_at)) || new Date())
    });
    data.push(run);
    this.updateSelectedWorkUnits(runSchedule);
    this.updateEarliestDate(runSchedule.map(schedule => schedule.schedule_date));

    this.setState({
      data: data,
      runSchedule: runSchedule
    });
  }

  renderAddButton() {
    const style = {
      type: 'primary',
      size: 'small'
    };

    return (
      <Button
        {...style}
        onClick={() => {
          this.setState({ showEmptyDevice: false }); this.addDevice();
        }}
      >
        Add device set
      </Button>
    );
  }

  render() {
    const { run, modalType, userId, labIds } = this.props;
    const {
      data,
      runSchedule,
      workunits,
      showEmptyDevice,
      selectedOperatorId
    } = this.state;

    return (
      <SinglePaneModal
        title={modalType !== 'schedule' ? 'Run approval' : 'Run schedule'}
        modalId={ApprovalModal.MODAL_ID}
        modalWrapperClass="run-approval-modal-wrapper"
        modalBodySmallPaddingTop={modalType === 'schedule'}
        modalSize={'xlg'}
        closeOnClickOut={false}
        onAccept={() => { this.props.runApprove(this.getRunApproveRequest()); }}
        acceptText={modalType !== 'schedule' ? 'Approve' : 'Save'}
        dismissText="Cancel"
        beforeDismiss={this.toggleOpen}
        renderFooter
        type={'primary'}
        size={'small'}
      >
        <div className="run-approval">
          {modalType !== 'schedule' && (
            <Section title="Details">
              <div className="row">
                <div className="col-sm-4">
                  <KeyValueList
                    isLeftRight
                    entries={[
                      { key: 'Name', value: run && (run.title || `Run ${run.id}`) }
                    ]}
                  />
                </div>
                <div className="col-sm-4">
                  <KeyValueList
                    isLeftRight
                    entries={[
                      { key: 'Submitted', value: dateStringFormatter(run && run.created_at) }
                    ]}
                  />
                </div>
                <div className="col-sm-4">
                  <KeyValueList
                    isLeftRight
                    entries={[
                      { key: 'Requested due date', value: dateStringFormatter(run && run.requested_at) }
                    ]}
                  />
                </div>
              </div>
            </Section>
          )}
          {modalType !== 'schedule' && (
            <Section title="Options">
              <div className="row">
                <div className="col-sm-2 priority-dropdown">
                  <LabeledInput label="Priority">
                    <Select
                      value={this.state.priority}
                      onChange={e => this.onPrioritySelect(e.target.value)}
                      placeholder={'Select Priority'}
                      options={[
                        {
                          name: 'High',
                          value: 'High'
                        },
                        {
                          name: 'Medium',
                          value: 'Medium'
                        },
                        {
                          name: 'Low',
                          value: 'Low'
                        }
                      ]}
                    />
                  </LabeledInput>
                </div>
                <div className="col-sm-4 operator-dropdown">
                  <LabeledInput label="Operator">
                    <OperatorsFilter
                      currentUserId={userId}
                      labIds={labIds}
                      singleSelectId={selectedOperatorId}
                      onSingleChange={this.onOperatorSelect}
                      includeCustomOptions
                      customOperatorOptions={[{ value: userId, name: 'Assign to Me' }]}
                      isSingleSelect
                    />
                  </LabeledInput>
                </div>
              </div>
            </Section>
          )}
          {AcsControls.isFeatureEnabled(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION) && (
            <Schedule
              run={run}
              addDevice={this.addDevice}
              data={data}
              runSchedule={runSchedule}
              workunits={workunits}
              updateRunSchedule={this.updateRunSchedule}
              renderAddButton={this.renderAddButton}
              showEmptyDevice={showEmptyDevice}
              fetchWorkUnitsAndRunschedules={this.fetchWorkUnitsAndRunschedules}
              deleteDevice={this.deleteDevice}
              calculateMinTime={this.calculateMinTime}
              calculateMaxTime={this.calculateMaxTime}
              modalType={modalType}
              currentRunSchedules={this.getCurrentRunSchedules()}
              earliestDate={new Date(this.state.earliestDate)}
              isLoading={this.state.isLoading}
            />
          )}
        </div>
      </SinglePaneModal>
    );
  }
}

export default ApprovalModal;
