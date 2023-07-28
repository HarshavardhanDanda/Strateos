import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Immutable from 'immutable';
import { inflect } from 'inflection';
import _ from 'lodash';

import { Button, ButtonGroup, Validated, Tooltip, Checkbox, Select, InputWithUnits } from '@transcriptic/amino';
import { SimpleInputsValidator, validators } from 'main/components/validation';
import { toScalar, formatForDisplay } from 'main/util/unit';
import friendlyStatus from 'main/util/SchedulerStatusUtil';

import './SendToWorkcellDrawer.scss';

function SendToWorkcellDrawer(props) {
  const currentSchedulerStatus = props.isTestSubmission ?
    friendlyStatus(_.get(props.schedules, 'test.schedules')) :
    friendlyStatus(_.get(props.schedules, 'production.schedules'));
  const dropDowns = generateDropdowns(props);
  const scheduleButtonDisabled = !configErrors.isValid(Immutable.fromJS({
    maxScheduleTime: props.maxScheduleTime.split(/:/)[0],
    selectedWorkcell: props.selectedWorkcell,
    numInstructions: props.numInstructions
  }));

  return (
    <div className="send-to-workcell-drawer tx-type--invert">
      <div className="row send-to-workcell-drawer__content">
        <div className="send-to-workcell-drawer__header col-sm-4">
          <h2 className="tx-type--heavy">Submit Instructions to Workcell</h2>
          <h4>{`${props.numInstructions} ${inflect('instruction', props.numInstructions)} selected`}</h4>
          <If condition={currentSchedulerStatus}>
            <p className="send-to-workcell-drawer__scheduler-status tx-type--warning">
              {currentSchedulerStatus}
            </p>
          </If>
        </div>
        <div className="send-to-workcell-drawer__configuration">
          <Checkbox
            id="workcell-schedule-submission-is-test"
            name="test-submission"
            onChange={props.onTestWorkcellToggleChange}
            checked={props.isTestSubmission ? 'checked' : 'unchecked'}
            value="workcell-schedule-submission-is-test"
            label={(
              <span className="tx-inline tx-inline--xxxs">
                <span>Test </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  Submission&nbsp;
                  <span style={{ whiteSpace: 'normal' }}>
                    <Tooltip
                      invert
                      placement="right"
                      title="Schedule a test submission for the selected device set."
                    >
                      <i className="fa fa-question-circle" />
                    </Tooltip>
                  </span>
                </span>
              </span>
            )}
          />
          <div className={'send-to-workcell-drawer__config-section-container'} style={{ display: 'flex', justifyContent: 'flex-start' }}>
            {dropDowns}
            <div
              className={classNames(
                'send-to-workcell-drawer__time-allowance',
                'send-to-workcell-drawer__config-section',
                'tx-stack',
                'tx-stack--xxs'
              )}
            >
              <h3 className="tx-type--heavy">Time Allowance</h3>
              <Validated warning={checkScheduleAllowanceWarning(props.maxScheduleTime)}>
                <InputWithUnits
                  dimension="time"
                  value={props.maxScheduleTime}
                  disabled={props.isBusy}
                  onChange={props.onScheduleTimeChange}
                  name="send-to-workcell-drawer-schedule-allowance"
                />
              </Validated>
            </div>
            <div />
          </div>
          <div
            className={classNames(
              'send-to-workcell-drawer__parameters',
              'send-to-workcell-drawer__config-section'
            )}
            style={{ marginLeft: 0 }}
          >
            <Checkbox
              id="workcell-schedule-submission-reserve-destinies"
              name="reserve-destinies"
              onChange={props.onReserveDestiniesChange}
              value="workcell-schedule-submission-reserve-destinies"
              checked={props.reserveDestinies ? 'checked' : 'unchecked'}
              label={(
                <span className="tx-inline tx-inline--xxxs">
                  <span>Reserve </span>
                  <span style={{ whiteSpace: 'nowrap' }}>Destinies&nbsp;
                    <span style={{ whiteSpace: 'normal' }}>
                      <Tooltip
                        invert
                        placement="top"
                        title={`Reserve locations in TIsos for containers. Containers will be stored automatically at
                          the end of the run. If left unchecked, containers will be returned to the handoff.`}
                      >
                        <i className="fa fa-question-circle" />
                      </Tooltip>
                    </span>
                  </span>
                </span>
              )}
            />
            <Checkbox
              id="workcell-schedule-submission-constraint-violations"
              name="allow-constraint-violations"
              onChange={props.onAllowConstraintViolationsToggleChange}
              value="workcell-schedule-submission-constraint-violations"
              checked={props.allowConstraintViolations ? 'checked' : 'unchecked'}
              disabled={!props.isTestSubmission}
              label={(
                <span className="tx-inline tx-inline--xxxs">
                  <span>Allow Time Constraint </span>
                  <span style={{ whiteSpace: 'nowrap' }}>Violations&nbsp;
                    <span style={{ whiteSpace: 'normal' }}>
                      <Tooltip
                        invert
                        placement="top"
                        title={`Return the best schedule found, even if it violates time constraints. Useful for
                        debugging protocols. This option can be used for Test Submissions only.`}
                      >
                        <i className="fa fa-question-circle" />
                      </Tooltip>
                    </span>
                  </span>
                </span>
              )}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }} className="col-sm-3">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ButtonGroup orientation="horizontal">
              <Button
                onClick={() => {
                  props.onCancel();
                  if (props.scheduleDelay > 0) {
                    props.onAbort();
                  }
                }}
                type="primary"
                link
                heavy
              >Cancel
              </Button>
              <Choose>
                <When condition={props.scheduleDelay > 0}>
                  <p>Scheduling in {props.scheduleDelay} {inflect('second', props.scheduleDelay)}.</p>
                  <Button
                    type="warning"
                    size="medium"
                    height="tall"
                    onClick={props.onAbort}
                    waitForAction
                  >{(props.workcellState === 'aborting') ? 'Aborting...' : 'Abort'}
                  </Button>
                </When>
                <Otherwise>
                  <Button
                    type="success"
                    size="medium"
                    height="tall"
                    onClick={props.onSchedule}
                    waitForAction
                    disabled={scheduleButtonDisabled}
                  >{getButtonText(currentSchedulerStatus, props.workcellState)}
                  </Button>
                </Otherwise>
              </Choose>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  );
}

const configErrors = SimpleInputsValidator({
  maxScheduleTime: { validators: [validators.non_empty, validators.positive_float] },
  selectedWorkcell: { validators: [validators.non_empty] },
  numInstructions: { validators: [validators.positive_integer] }
});

const checkScheduleAllowanceWarning = (input) => {
  const suggested_max = '5:minute';
  const suggested_min = '1:minute';
  const value_sec = toScalar(input, 'second');
  if (value_sec > toScalar(suggested_max, 'second')) {
    return `${
      formatForDisplay(input)
    } requested: This exceeds the suggested maximum of ${
      formatForDisplay(suggested_max)
    }.`;
  }

  if (value_sec < toScalar(suggested_min, 'second')) {
    return `${
      formatForDisplay(input)
    } requested: A minimum of ${
      formatForDisplay(suggested_min)
    } is suggested.`;
  }

  return undefined;
};

const getButtonText = (currentSchedulerStatus, workcellState) => {

  switch (workcellState) {
    case 'ready':
      return currentSchedulerStatus ? 'Queue' : 'Submit';
    case 'requesting':
      return 'Sending...';
    case 'waiting':
      return 'Waiting...';
    case 'scheduling':
      return 'Scheduling...';
    case 'aborting':
      return 'Aborting';
    default:
      return '';

  }
};

const generateDropdowns = (props) => {
  const workcellOptions = props.workcellChoices.map(({ id, name, disabled }) => {
    return {
      value: id,
      disabled: disabled != undefined ? disabled : false,
      name: name
    };
  });
  const sessionOptions = [{ name: 'Create New', sessionId: 'new' }, ...props.sessionChoices].map(({ sessionId, name, disabled }) => {
    return {
      value: sessionId,
      name,
      disabled: disabled || false
    };
  });
  const dropDowns = [
    <div
      key={'conig-workcell'}
      className={classNames(
        'send-to-workcell-drawer__workcell',
        'send-to-workcell-drawer__config-section',
        'tx-stack tx-stack--xxs'
      )}
    >
      <h3 className="tx-type--heavy">Workcell</h3>
      <div className="tx-stack tx-stack--xxs">
        <Select
          className="select-workcell"
          value={props.selectedWorkcell || ''}
          disabled={props.isBusy}
          onChange={props.onWorkcellChoiceChange}
          options={workcellOptions}
        />
      </div>
    </div>];

  if (props.isTestSubmission) {
    dropDowns.push(
      <div
        key={'conig-sessions'}
        className={classNames(
          'send-to-workcell-drawer__workcell',
          'send-to-workcell-drawer__config-section',
          'tx-stack tx-stack--xxs'
        )}
      >
        <h3 className="tx-type--heavy">Session</h3>
        <div className="tx-stack tx-stack--xxs">
          <Select
            className="select-session"
            value={props.selectedSession || ''}
            disabled={!props.selectedWorkcell || !props.sessionChoices.length || !props.isTestSubmission}
            onChange={props.onSessionChoiceChange}
            options={sessionOptions}
          />
        </div>
      </div>);
  }
  return dropDowns;
};

const scheduleStatsShape = PropTypes.shape({
  schedules: PropTypes.objectOf( // keys are job IDs
    PropTypes.shape({
      startTime: PropTypes.number, // job's (possibly projected) start time
      stopTime: PropTypes.number.isRequired, // job's projected end time
      mcxId: PropTypes.string
    })
  )
});

SendToWorkcellDrawer.propTypes = {
  scheduleDelay: PropTypes.number,
  onAbort: PropTypes.func.isRequired,
  selectedWorkcell: PropTypes.string,
  selectedSession: PropTypes.string,
  isTestSubmission: PropTypes.bool,
  allowConstraintViolations: PropTypes.bool,
  reserveDestinies: PropTypes.bool,
  workcellState: PropTypes.oneOf(['ready', 'waiting', 'requesting', 'scheduling', 'aborting']),
  workcellChoices: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.string,
    disabled: PropTypes.bool
  })),
  onCancel: PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired,
  maxScheduleTime: PropTypes.string,
  isBusy: PropTypes.bool,
  onAllowConstraintViolationsToggleChange: PropTypes.func.isRequired,
  onTestWorkcellToggleChange: PropTypes.func.isRequired,
  onWorkcellChoiceChange: PropTypes.func.isRequired,
  onSessionChoiceChange: PropTypes.func.isRequired,
  onReserveDestiniesChange: PropTypes.func.isRequired,
  onScheduleTimeChange: PropTypes.func.isRequired,
  numInstructions: PropTypes.number,
  schedules: PropTypes.shape({
    production: scheduleStatsShape,
    test: scheduleStatsShape
  })
};

export default SendToWorkcellDrawer;
