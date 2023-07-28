import Moment from 'moment';
import * as TimeUtil from 'main/util/TimeUtil';
import { Utilities } from '@transcriptic/amino';

const { formatDuration } = Utilities.Dates;

const parseDate = (run, field) => {
  return parseDateWithFormat(run, field, 'MMMM Do YYYY, h:mm a');
};

const parseDateWithFormat = (run, field, format) => {
  return run.get(field) ? Moment(run.get(field)).format(format) : 'Unavailable';
};

const date = (run, field) => {
  return run.get(field) ? Moment(run.get(field)) : 0;
};

const duration = (run) => {
  const completed = date(run, 'completed_at');
  const started = date(run, 'started_at');
  return (completed !== 0 && started !== 0) ? formatDuration(completed - started) : 'Unavailable';
};

export const statusPopoverItems = (run, status) => {
  const items = [];
  switch (status) {
    case 'pending':
      items.push({ header: 'Requested Date', content: parseDate(run, 'requested_at') });
      if (run.get('estimated_run_time')) {
        const timeString = TimeUtil.humanizeDuration((run.get('estimated_run_time')) * 1000);
        items.push({ header: 'Estimated Time', content: timeString });
      }
      break;
    case 'canceled':
      items.push({ header: 'Requested Date', content: parseDate(run, 'requested_at') });
      items.push({ header: 'Canceled Date', content: parseDate(run, 'canceled_at') });
      break;
    case 'rejected':
      items.push({ header: 'Requested Date', content: parseDate(run, 'requested_at') });
      items.push({ header: 'Rejected Date', content: parseDate(run, 'rejected_at') });
      break;
    case 'accepted':
      items.push({ header: 'Requested Date', content: parseDate(run, 'requested_at') });
      items.push({ header: 'Accepted Date', content: parseDate(run, 'accepted_at') });
      items.push({ header: 'Started Date', content: parseDate(run, 'started_at') });
      if (run.get('estimated_run_time')) {
        const timeString = TimeUtil.humanizeDuration((run.get('estimated_run_time')) * 1000);
        items.push({ header: 'Estimated Time', content: timeString });
      }
      break;
    case 'in_progress':
      items.push({ header: 'Started Date', content: parseDate(run, 'started_at') });
      items.push({ header: 'Time Elapsed', content: formatDuration(Moment.now() - date(run, 'started_at')) });
      break;
    case 'aborted':
      items.push({ header: 'Started Date', content: parseDate(run, 'started_at') });
      items.push({ header: 'Aborted Date', content: parseDate(run, 'aborted_at') });
      break;
    case 'complete':
      items.push({ header: 'Started Date', content: parseDate(run, 'started_at') });
      items.push({ header: 'Completed Date', content: parseDate(run, 'completed_at') });
      items.push({ header: 'Duration', content: duration(run) });
      break;
  }
  return items;
};
