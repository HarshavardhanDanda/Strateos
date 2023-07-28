import React      from 'react';
import { Button, Table, Column, Select, DatePicker, ZeroState, Calendar, Spinner, TextInput, Section } from '@transcriptic/amino';
import  classNames  from 'classnames';
import Immutable from 'immutable';
import './ApprovalModal.scss';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';

class Schedule extends React.Component {
  constructor(props) {
    super(props);

    this.renderWorkcellDropDown = this.renderWorkcellDropDown.bind(this);
    this.onDeviceSelect = this.onDeviceSelect.bind(this);
    this.renderDatePicker = this.renderDatePicker.bind(this);
    this.renderDeleteAction = this.renderDeleteAction.bind(this);
    this.handleRuntime = this.handleRuntime.bind(this);
    this.renderRuntime = this.renderRuntime.bind(this);
    this.renderTimePicker = this.renderTimePicker.bind(this);
    this.onScheduleTime = this.onScheduleTime.bind(this);

    this.state = {
      calendarVisible: props.modalType === 'schedule'
    };
  }

  componentDidMount() {
    this.props.fetchWorkUnitsAndRunschedules(this.props.run.lab_id);
  }

  onDeviceSelect(value, rowIndex) {
    this.props.updateRunSchedule('workunit_id', value, rowIndex);
  }

  onScheduleDateSelect(value, rowIndex) {
    this.props.updateRunSchedule('schedule_date', value, rowIndex);
  }

  onScheduleTime(value, rowIndex) {
    this.props.updateRunSchedule('schedule_time', value, rowIndex);
  }

  handleRuntime(e, rowIndex) {
    this.props.updateRunSchedule('run_time', Number(e.target.value), rowIndex);
  }

  renderDatePicker(record, rowIndex) {
    return (
      <DatePicker
        name={'schedule-date'}
        placeholder={'Schedule date'}
        minDate={new Date()}
        date={this.props.runSchedule[rowIndex] ? new Date(this.props.runSchedule[rowIndex].schedule_date) : ''}
        onChange={event => this.onScheduleDateSelect(event.target.value.date, rowIndex)}
        isSelectField
        fixedPosition
        shouldNotCloseOnOutsideClick
        popperPlacement="bottom"
      />
    );
  }

  renderTimePicker(record, rowIndex) {
    return (
      <DatePicker
        timeIntervals={30}
        isTimeSelector
        minTime={this.props.calculateMinTime(this.props.runSchedule[rowIndex] ? this.props.runSchedule[rowIndex].schedule_date : '')}
        maxTime={this.props.calculateMaxTime(this.props.runSchedule[rowIndex] ? this.props.runSchedule[rowIndex].schedule_date : '')}
        date={this.props.runSchedule[rowIndex] ? this.props.runSchedule[rowIndex].schedule_time : ''}
        onChange={event => this.onScheduleTime(event.target.value.date, rowIndex)}
        isSelectField
        fixedPosition
        shouldNotCloseOnOutsideClick
        popperPlacement="bottom"
      />
    );
  }

  renderWorkcellDropDown(record, rowIndex) {
    return (
      <Select
        value={this.props.runSchedule[rowIndex] ? this.props.runSchedule[rowIndex].workunit_id : ''}
        onChange={e => this.onDeviceSelect(e.target.value, rowIndex)}
        placeholder={'Select Device'}
        options={this.props.workunits}
      />
    );
  }

  renderDeleteAction(record, rowIndex) {
    return (
      <Button link type="info" icon="far fa-trash-alt" size="large" label="Action" onClick={() => this.props.deleteDevice(rowIndex)} />
    );
  }

  renderRuntime(record, rowIndex) {
    return (
      <TextInput type="number" placeholder="1" step="1" min="1" value={this.props.runSchedule[rowIndex] ? this.props.runSchedule[rowIndex].run_time : ''} onChange={(e) => this.handleRuntime(e, rowIndex)} />
    );
  }

  render() {
    const { modalType, isLoading } = this.props;

    return (
      <div className="run-approval">
        {isLoading ? <Spinner /> : (
          <Section title={modalType !== 'schedule' && 'Scheduling'}>
            <div className="row">
              {!this.props.showEmptyDevice ? (
                <div className="col-sm-12">
                  <div className="tx-stack tx-stack--sm">
                    {modalType !== 'schedule' && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          this.setState(prevState => ({
                            calendarVisible: !prevState.calendarVisible
                          }));
                        }}
                      >
                        {this.state.calendarVisible ? 'Hide calendar' : 'Show calendar'}
                      </Button>
                    )}
                    {this.state.calendarVisible && (
                      <div className="calendar-container">
                        <Calendar
                          showRange
                          hideViewDropdown
                          events={this.props.currentRunSchedules}
                          selectedDate={this.props.earliestDate}
                        />
                      </div>
                    )}
                    {AcsControls.isFeatureEnabled(FeatureConstants.MULTI_DEVICE_RUN_SCHEDULE) && (
                      <Button className={classNames('add-device', this.state.calendarVisible && 'add-device__margin-top')} type="primary" size="small" onClick={this.props.addDevice}> Add Device</Button>
                    )}
                    <Table
                      id="schedule"
                      data={Immutable.fromJS(this.props.data)}
                      loaded
                      disabledSelection
                    >
                      <Column renderCellContent={this.renderWorkcellDropDown} header="DEVICE SET" id="column-1" />
                      <Column renderCellContent={this.renderRuntime} header="RUN TIME (hours)" id="column-2" />
                      <Column renderCellContent={this.renderDatePicker} header="SCHEDULE DATE" id="column-3" />
                      <Column renderCellContent={this.renderTimePicker} header="TIME" id="column-4" />
                      <Column renderCellContent={this.renderDeleteAction} id="column-5" />
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="col-sm-12">
                  <ZeroState
                    zeroStateSvg={'/images/materials-illustration.svg'}
                    subTitle={'There are no devices added to this run'}
                    button={this.props.renderAddButton()}
                  />
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    );
  }
}

export default Schedule;
