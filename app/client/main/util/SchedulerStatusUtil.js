import _      from 'lodash';
import Moment from 'moment';

import { inflect } from 'inflection';

const friendlyStatus = (schedules) => {
  const numSchedules = _.size(schedules);

  if (numSchedules > 0) {
    const endOfCurrentJobs = _.max(
      _.map(schedules, details => details.stopTime)
    );

    return `${numSchedules} ${inflect('run', numSchedules)} ${
      inflect('is', numSchedules, 'is', 'are')
    } being scheduled. If you submit a run now, it will start scheduling ${
      Moment(endOfCurrentJobs).fromNow()
    } or less.`;
  }

  return undefined;
};

export default friendlyStatus;
