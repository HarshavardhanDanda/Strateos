import Moment from 'moment';
import _ from 'lodash';

// [warp1, ...] -> [{start,end}, ...]
const warpsToTimes = (warps = []) => {
  return warps.map((warp) => {
    return {
      start: Moment(warp.reported_started_at).toDate().getTime(),
      end:   Moment(warp.reported_completed_at).toDate().getTime()
    };
  });
};

const warpsStartEnd = (warps = []) => {
  const allWarpTimes = warpsToTimes(warps);
  const range = [allWarpTimes[0].start, _.last(allWarpTimes).end];

  if (isNaN(range[0]) || isNaN(range[1])) return false;

  return range;
};

const canViewDiagnosticsData = (instruction) => {
  return instruction.completed_at &&
         instruction.warps &&
         instruction.warps.length > 0 &&
         warpsStartEnd(instruction.warps);
};

export {
  warpsToTimes,
  warpsStartEnd,
  canViewDiagnosticsData
};
