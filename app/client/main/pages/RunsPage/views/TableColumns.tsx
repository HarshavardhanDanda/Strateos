import React from 'react';
import _ from 'lodash';
import Moment from 'moment';
import { Column as TableColumn, Profile, Popover, Tooltip, StatusPill } from '@transcriptic/amino';
import * as TimeUtil from 'main/util/TimeUtil';
import Immutable from 'immutable';
import { inflect } from 'inflection';
import UserStore from 'main/stores/UserStore';
import { LabObject } from 'main/stores/mobx/LabStore';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import { statusPopoverItems } from 'main/components/RunStatusLabel/StatusItems';
import RunTimingInfo from 'main/components/RunStatusLabel/RunTimingInfo';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';

// TODO: use real types for record
type CellItem = Immutable.Map<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type RenderFnc = (record: CellItem) => JSX.Element | '' | undefined;
type LabGetter = (id: string) => LabObject;

enum Column {
  Name = 'name',
  Id = 'id',
  Org = 'organization',
  Rejected = 'rejected',
  Submitted = 'submitted',
  AcceptedAt = 'accepted at',
  Protocol = 'protocol name',
  Reason = 'reason',
  Status = 'status',
  RequestedDate = 'requested due date',
  Operator = 'operator',
  ScheduledStart = 'scheduled start',
  Started = 'started',
  Completed = 'completed',
  Aborted = 'aborted',
  EstRunTime = 'est run time',
  Cost = 'cost',
  Priority = 'priority',
  Submitter = 'submitter',
  Lab = 'lab',
  Workcell = 'workcell',
  EstStartTime = 'est start time',
  EstEndTime = 'est end time',
  TimeInQueue = 'time in queue',
  Description = 'description',
  Canceled = 'canceled at',
  CanceledReason = 'reason'
}

function gatherQueueColumns(runStatus: string, showOrgInfo: boolean, labGetter: LabGetter, canManageRunState: boolean) {
  const columns = [
    baseColumn(Column.Name, renderName(runStatus), 'title', true),
    baseColumn(Column.Protocol, renderProtocolName, 'protocol_name', true),
    baseColumn(Column.Id, renderId(runStatus), 'id', false),
    baseColumn(Column.Status, renderStatusWithTiming, 'status', true),
    baseColumn(Column.Org, renderOrganization, 'organization_name', true, !showOrgInfo),
    renderDateColumn(runStatus),
    baseColumn(Column.Submitted, renderSubmittedDate, 'created_date', true, runStatus == 'all_runs'),
    baseColumn(Column.AcceptedAt, renderAcceptedDate, 'accepted_date', true),
    baseColumn(Column.EstRunTime, renderEstRunTime, 'estimated_run_time_cache', false),
    baseColumn(Column.Cost, renderCost, 'total_cost', true, !canManageRunState, true),
    baseColumn(Column.Operator, renderOperator, 'assigned_to_id', false),
    baseColumn(Column.RequestedDate, renderRequested, 'requested_at', false, !canManageRunState),
    baseColumn(Column.Priority, renderPriority, 'priority', true),
    baseColumn(Column.Submitter, renderSubmitter, 'owner', false),
    baseColumn(Column.Lab, renderLab(labGetter), 'lab_id', true),
    baseColumn(Column.Workcell, renderWorkcell, 'scheduled_workcell', true),
    baseColumn(Column.EstStartTime, renderEstStartTime, 'scheduled_to_start_at', false),
    baseColumn(Column.EstEndTime, renderEstEndTime, 'est_end_time', false),
    baseColumn(Column.TimeInQueue, renderTimeInQueue, 'can_start_at', false),
    baseColumn(Column.Canceled, renderCanceledDate, 'canceled_at', true),
    baseColumn(Column.CanceledReason, renderCanceledReason, 'canceled_reason', false)
  ];

  const columnsWithoutPopOver = [Column.Status, Column.Operator, Column.Submitter].map(c => c.toString());
  const permittedColumns = columns.filter(c => c != undefined);
  return [permittedColumns, columnsWithoutPopOver];
}

function makeQueueColumns(runStatus: string, showOrgInfo: boolean, labGetter: LabGetter, canManageRunState: boolean) {
  const [permittedColumns, columnsWithoutPopOver] = gatherQueueColumns(runStatus, showOrgInfo, labGetter, canManageRunState);
  return permittedColumns.map(column => {
    return (
      <TableColumn
        renderCellContent={column.columnRenderFunction}
        header={column.columnHeader}
        id={column.id}
        key={column.id}
        sortable={column.sortable}
        popOver={!columnsWithoutPopOver.includes(column.columnHeader)}
        alignContentRight={column.columnHeader === Column.Cost}
        alignHeaderRight={column.alignHeaderRight}
      />
    );
  });
}

function gatherApprovalsColumns(runStatus: string, showOrgInfo: boolean, labGetter: LabGetter) {
  const statusIn = matches(runStatus);
  const columns = [
    baseColumn(Column.Name, renderName(runStatus), 'title', true, !statusIn('pending', 'rejected')),
    baseColumn(Column.Id, renderId(runStatus), 'id', false, !statusIn('pending', 'rejected')),
    baseColumn(Column.Status, renderStatusWithTiming, 'status', true, !statusIn('pending')),
    baseColumn(Column.Submitter, renderSubmitter, 'owner', false, !statusIn('pending', 'rejected')),
    baseColumn(Column.Reason, renderReason, 'reject_reason', false, !statusIn('rejected')),
    baseColumn(Column.Description, renderDescription, 'reject_description', false, !statusIn('rejected')),
    baseColumn(Column.Submitted, renderSubmittedDate, 'created_at', true, !statusIn('pending', 'rejected')),
    baseColumn(Column.Rejected, renderRejected, 'rejected_at', true, !statusIn('rejected')),
    baseColumn(Column.RequestedDate, renderRequested, 'requested_date', true, !statusIn('pending', 'rejected')),
    baseColumn(Column.EstRunTime, renderEstRunTime, 'estimated_run_time_cache', true, !statusIn('pending')),
    baseColumn(Column.Cost, renderCost, 'total_cost', true, !statusIn('pending', 'rejected'), true),
    baseColumn(Column.Org, renderOrganization, 'organization_name', true, !showOrgInfo || !statusIn('pending', 'rejected')),
    baseColumn(Column.Lab, renderLab(labGetter), 'lab_id', true, !statusIn('pending', 'rejected')),
    baseColumn(Column.Workcell, renderWorkcell, 'scheduled_workcell', true, !statusIn('pending', 'rejected')),
    baseColumn(Column.EstStartTime, renderEstStartTime, 'scheduled_to_start_at', false, !statusIn('pending', 'rejected')),
    baseColumn(Column.EstEndTime, renderEstEndTime, 'est_end_time', false, !statusIn('pending', 'rejected')),
    baseColumn(Column.TimeInQueue, renderTimeInQueue, 'can_start_at', false, !statusIn('pending', 'rejected')),
  ];

  const columnsWithoutPopOver = [Column.Status, Column.Submitter].map(c => c.toString());
  const permittedColumns = columns.filter(c => c != undefined);
  return [permittedColumns, columnsWithoutPopOver];
}

function makeApprovalsColumns(runStatus: string, showOrgInfo: boolean, labGetter: LabGetter) {
  const [permittedColumns, columnsWithoutPopOver] = gatherApprovalsColumns(runStatus, showOrgInfo, labGetter);

  return permittedColumns.map(column => {
    return (
      <TableColumn
        renderCellContent={column.columnRenderFunction}
        header={column.columnHeader}
        id={column.id}
        key={column.id}
        sortable={column.sortable}
        popOver={!columnsWithoutPopOver.includes(column.columnHeader)}
        alignContentRight={column.columnHeader === Column.Cost}
        alignHeaderRight={column.alignHeaderRight}
      />
    );
  });
}

function gatherRunTransferModalColumns() {
  const columns = [
    baseColumn(Column.Name, renderName('', true), 'title', true),
    baseColumn(Column.Protocol, renderProtocolName, 'protocol_name', true),
    baseColumn(Column.Submitted, renderSubmittedDate, 'created_at', true),
    baseColumn(Column.Status, renderStatusWithTiming, 'status', true),
    baseColumn(Column.Submitter, renderSubmitter, 'owner', false),
  ];
  const permittedColumns = columns.filter(c => c != undefined);
  return permittedColumns;
}

function makeRunTransferModalColumns() {
  const permittedColumns = gatherRunTransferModalColumns();

  return permittedColumns.map(column => {
    return (
      <TableColumn
        renderCellContent={column.columnRenderFunction}
        header={column.columnHeader}
        id={column.id}
        key={column.id}
        sortable={column.sortable}
      />
    );
  });
}

// Quick function for common pattern of checking if target string is in a collection of string options
const matches = (target: string) => (...options: Array<string>) => {
  return options.includes(target);
};

function baseColumn(colName: string, colFunction: RenderFnc, id: string, sortable: boolean, disabled = false, alignHeaderRight = false) {
  if (disabled) {
    return undefined;
  }

  return {
    id,
    columnHeader: colName,
    columnRenderFunction: colFunction,
    sortable,
    alignHeaderRight,
  };
}

const renderName = (runStatus: string, showIdIfNameIsNull = false) => function(record: CellItem) {
  const url = `${runStatus}/runs/${record.get('id')}/prime`;
  let runName = record.get('title');
  if (_.isNull(runName)) {
    runName = showIdIfNameIsNull ? record.get('id') : '—';
  }

  if (runStatus) {
    return (
      <a className="runs-column-link" href={url}>
        {runName}
      </a>
    );
  }
  return <span>{runName}</span>;
};

const renderId = (runStatus: string) => function(record: CellItem) {
  const runId = record.get('id');
  const url = `${runStatus}/runs/${runId}`;

  return (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUN_DETAILS) ?
    <a className="runs-column-link" href={url}>{runId}</a> : <p>{runId}</p>);
};

function hasTimingInfo(status: string) {
  return RUN_STATUSES_WITH_TIMING.includes(status);
}
const RUN_STATUSES_WITH_TIMING = [
  RunStatuses.Accepted,
  RunStatuses.InProgress,
  RunStatuses.Complete,
  RunStatuses.Aborted,
  RunStatuses.Canceled,
  RunStatuses.Pending,
  RunStatuses.Rejected,
].map(s => s.toString());

function renderTimingContent(run: CellItem) {
  const status = run.get('status');
  if (hasTimingInfo(status)) {
    return (<RunTimingInfo items={_.compact(statusPopoverItems(run, status))} />);
  }
  return '';
}

function renderStatusWithTiming(record: CellItem) {
  const billingValid      = record.get('billing_valid?');
  const shipmentPending   = record.get('pending_shipment_ids').size > 0;
  const unmetRequirements = record.get('unrealized_input_containers_count');

  var runStatus = record.get('status');

  if (!billingValid) {
    runStatus = 'billing_invalid';
  } else if (unmetRequirements) {
    runStatus = 'awaiting';
  } else if (shipmentPending) {
    runStatus = 'shipment_pending';
  }

  const statusText = {
    accepted: 'Accepted',
    in_progress: 'In Progress',
    shipment_pending: 'Shipment Pending',
    billing_invalid: 'Billing Invalid',
    aborted: 'Aborted',
    complete: 'Completed',
    canceled: 'Canceled',
    pending: 'Pending',
    rejected: 'Rejected',
    awaiting: `Awaiting ${
      unmetRequirements
    } Generated ${inflect('Container', unmetRequirements)}`,
  };

  const statusType = {
    accepted: 'action',
    in_progress: 'warning',
    shipment_pending: 'warning',
    billing_invalid: 'danger',
    aborted: 'danger',
    complete: 'success',
    canceled: 'danger',
    rejected: 'danger',
    pending: 'warning',
    awaiting: 'warning',
  };

  const renderStatus = (
    <StatusPill
      type={statusType[runStatus]}
      shape="tag"
      text={statusText[runStatus]}
    />
  );
  if (hasTimingInfo(runStatus)) {
    return (
      <Popover
        placement="bottom"
        title="Timing Information"
        content={renderTimingContent(record)}
      >
        { renderStatus }
      </Popover>
    );
  } else {
    return renderStatus;
  }
}

function renderDescription(record: CellItem) {
  return <p>{record.get('reject_description')}</p>;
}

function renderOrganization(record: CellItem) {
  return <p>{record.get('organization_name')}</p>;
}

function renderPopOverUser(userName: string, userImg: string) {
  return (
    <Tooltip
      placement="bottom"
      title={userName}
      invert
    ><Profile imgSrc={userImg} name={userName} showDetails showPopover={false} />
    </Tooltip>
  );
}

function renderOperator(record: CellItem) {
  const user = UserStore.getById(record.get('assigned_to_id'));
  return user ? renderPopOverUser(user.get('name'), user.get('profile_img_url')) : <p>Unassigned</p>;
}

function dateStringFormatter(date: string, type = '') {
  if (date) {
    return Moment(date).format('MMM D, YYYY');
  } else {
    return (type === 'scheduled') ? 'Unscheduled' : '';
  }
}

function renderScheduled(record: CellItem) {
  return <p>{dateStringFormatter(record.get('scheduled_to_start_at'), 'scheduled')}</p>;
}

function renderStarted(record: CellItem) {
  return <p>{dateStringFormatter(record.get('started_at'))}</p>;
}

function renderAborted(record: CellItem) {
  return <p>{dateStringFormatter(record.get('aborted_at'))}</p>;
}

function renderCompleted(record: CellItem) {
  return <p>{dateStringFormatter(record.get('completed_at'))}</p>;
}

function renderDateColumn(activeStatus: string) {
  switch (activeStatus) {
    case RunStatuses.AllRuns:
      return baseColumn(Column.Submitted, renderSubmittedDate, 'created_date', true);
    case RunStatuses.Accepted:
      return baseColumn(Column.ScheduledStart, renderScheduled, 'scheduled_to_start_at', true);
    case RunStatuses.InProgress:
      return baseColumn('started', renderStarted, 'started_date', true);
    case RunStatuses.Complete:
      return baseColumn('completed', renderCompleted, 'completed_date', true);
    case RunStatuses.Aborted:
      return baseColumn('aborted', renderAborted, 'aborted_date', true);
    default:
      return baseColumn(Column.ScheduledStart, renderScheduled, 'scheduled_to_start_at', true);
  }
}

function renderEstRunTime(record: CellItem) {
  var timeString = '-';
  if (record.has('estimated_run_time_cache')) {
    timeString = TimeUtil
      .humanizeDuration(record.get('estimated_run_time_cache') * 1000);
  }
  return <p>{timeString}</p>;
}

function renderPriority(record: CellItem) {
  return <p>{record.get('priority')}</p>;
}

function renderProtocolName(record: CellItem) {
  return <p>{record.getIn(['protocol', 'name'], '—')}</p>;
}

function renderRequested(record: CellItem) {
  return <p>{dateStringFormatter(record.get('requested_at'))}</p>;
}

function renderRejected(record: CellItem) {
  return <p>{dateStringFormatter(record.get('rejected_at'))}</p>;
}

function renderReason(record: CellItem) {
  return <p>{record.get('reject_reason')}</p>;
}

function renderCost(record: CellItem) {
  return <p>{'$' + record.get('total_cost')}</p>;
}

function renderWorkcell(record: CellItem) {
  return <p>{record.get('scheduled_workcell')}</p>;
}

function renderSubmitter(record: CellItem) {
  const userName = record.getIn(['owner', 'name']);
  const userImg = record.getIn(['owner', 'profile_img_url']);
  return userName ? renderPopOverUser(userName, userImg) : <p>Unassigned</p>;
}

function renderEstStartTime(record: CellItem) {
  var timeString = '';
  var scheduledAt = record.get('scheduled_to_start_at');
  if (scheduledAt) {
    timeString = TimeUtil
      .humanizeDuration(scheduledAt * 1000);
  }
  return <p>{timeString}</p>;
}

function renderEstEndTime(record: CellItem) {
  var timeString = '';
  if (record.get('scheduled_to_start_at')) {
    timeString = TimeUtil
      .humanizeDuration((record.get('scheduled_to_start_at')
      + record.get('estimated_run_time_cache')) * 1000);
  }
  return <p>{timeString}</p>;
}

function renderTimeInQueue(record: CellItem) {
  var timeString = '';
  var timeInQueue = record.get('can_start_at') && !record.get('started_at')
    ? Moment().diff(Moment(record.get('can_start_at')))
    : undefined;
  if (timeInQueue) {
    timeString = TimeUtil
      .humanizeDuration(timeInQueue, false);
  }
  return <p>{timeString}</p>;
}

const renderLab = (labGetter: LabGetter) => function(record: CellItem) {
  const lab = labGetter(record.get('lab_id'));
  return <p>{lab ? lab.name : '-'}</p>;
};

function renderSubmittedDate(record) {
  return <p>{dateStringFormatter(record.get('created_at'))}</p>;
}

function renderAcceptedDate(record) {
  return <p>{dateStringFormatter(record.get('accepted_at'))}</p>;
}

function renderCanceledDate(record) {
  return <p>{dateStringFormatter(record.get('canceled_at'))}</p>;
}

function renderCanceledReason(record) {
  return <p>{record.get('canceled_reason') ? record.get('canceled_reason') : '-'}</p>;
}

export {
  makeApprovalsColumns,
  makeQueueColumns,
  makeRunTransferModalColumns,
  gatherApprovalsColumns,
  gatherQueueColumns,
  Column,
  renderName,
};
