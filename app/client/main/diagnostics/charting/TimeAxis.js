import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

import FontFace from './FontFace';
import measureText from './measureText';
import { drawText } from './drawing';
import DateUtils from './DateUtils';

const POSSIBLE_GRAINS = ['second', 'minute', 'hour', 'day', 'month', 'year'];

const PIXELS_BETWEEN_HASHES = 8; // minimal padding between every vert line in the time axis
const LABEL_PADDING = 3; // space between a hash mark and a label
const SMALLEST_HASH_MARK = 15; // shortest length of vert lines in time axis
const FONT_LARGEST_TIME_AXIS = 13;

const FONT_FACE = FontFace.Default(600);
const KEY_DIVIDER = '::';

// Returns a string or undefined if the label cannot be truncated to that level
// TODO: Day should display like "Feb 1 2011"
// TODO: Month should display like "Feb 2011"
const formatLabelByGrain = {
  second: function(truncateIndex, { second }) {
    switch (truncateIndex) {
      case 0:
        return second + 's';
      case 1:
        return second;
    }
  },
  minute: function(truncateIndex, { minute }) {
    switch (truncateIndex) {
      case 0:
        return minute + 'm'; // 7m
      case 1:
        return minute;
    }
  },
  hour: function(truncateIndex, { date }) {
    switch (truncateIndex) {
      case 0:
        return moment(date).format('ha'); // 7pm
      case 1:
        return moment(date).format('h');
    }
  },
  day: function(truncateIndex, { date }) {
    // Takes a Date object for moment to use
    switch (truncateIndex) {
      case 0:
        return moment(date).format('Do'); // Formats 31 as 31st
      case 1:
        return date.getDate();
    }
  },
  month: function(truncateIndex, { date }) {
    const m = moment(date);
    switch (truncateIndex) {
      case 0:
        return m.format('MMMM'); // July
      case 1:
        return m.format('MMM'); // Jul
      case 2:
        return m.format('MMM')[0];
    }
  }
};

/*
Renders a time axis with multiple levels of granularity.  For example,
If days are the smallest grain we can show, it will also render months and years.
"Ticks" denote a position on the axis.  A "Hash" is a vertical line marking the axis.
*/
class TimeAxis {
  constructor(props) {
    this.props = props;
  }

  render() {
    const { axisLabels, axisHashes } = this.calcShapes();
    this.renderLabels(axisLabels);
    this.renderHashes(axisHashes);
    this.renderAxisLine();
  }

  renderLabels(labels) {
    const { origin, ctx, canvasScale, textStyle } = this.props;

    ctx.save();

    labels.forEach((label) => {
      const { x, y, text, fontSize, width } = label;

      const size = fontSize || textStyle.fontSize;
      const scaledSize = size * canvasScale;
      const fontFace = FontFace('sans-serif');

      drawText(
        ctx,
        text,
        (x + origin.x) * canvasScale,
        (y + origin.y) * canvasScale,
        width,
        50, // This is arbitrary
        fontFace,
        {
          fontSize: scaledSize,
          lineHeight: scaledSize,
          color: textStyle.color
        }
      );
    });

    ctx.restore();
  }

  renderHashes(hashes) {
    const { origin, ctx, canvasScale, axisLineStyle } = this.props;
    ctx.save();
    ctx.strokeStyle = axisLineStyle.strokeStyle;
    ctx.lineWidth = `${axisLineStyle.lineWidth}px`;
    ctx.opacity = axisLineStyle.opacity;

    hashes.forEach((hash) => {
      let { x, y0, y1 } = hash;
      x += origin.x;

      const x0 = x * canvasScale;
      y0 = (origin.y + y0) * canvasScale;
      const x1 = x * canvasScale;
      y1 = (origin.y + y1) * canvasScale;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });
    ctx.restore();
  }

  renderAxisLine() {
    const { x, y } = this.props.origin;
    const { ctx, canvasScale, axisLineStyle } = this.props;

    const x0 = x * canvasScale;
    const x1 = (x + this.props.scale.range[1]) * canvasScale;
    const y0 = y * canvasScale;
    const y1 = y0;

    ctx.save();

    ctx.strokeStyle = axisLineStyle.strokeStyle;
    ctx.lineWidth = `${axisLineStyle.lineWidth}px`;
    ctx.opacity = axisLineStyle.opacity;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.restore();
  }

  calcShapes() {
    let fontSize,
      grain,
      groupIndex,
      i,
      row,
      text,
      textWidth,
      tick,
      tickGroup,
      tickIndex,
      ticks,
      truncateIndex,
      width,
      widthOfLargest;

    let numRows = POSSIBLE_GRAINS.length;
    let axisLabels = []; // all the labels on the axis
    let axisHashes = []; // all the vert lines on the axis

    // Calc basic rows of the axis (year, month, day rows)
    let tickGroups = [];
    for (row = 0; row < POSSIBLE_GRAINS.length; row++) {
      grain = POSSIBLE_GRAINS[row];
      ticks = this.ticksForGrain(grain, this.props.scale);
      if (!ticks) {
        continue;
      }
      const group = {
        ticks,
        grain
      };
      tickGroups.push(group);
    }

    /*
    Create the hash marks (the little vertical lines on the time axis).
    We will draw a hash mark for every tick, however, there will be overlap so we
    only draw one in this case.  For example, on January, 1, 2001, there are three (for year, month, and day)
    */

    // First, figure out if we even want to draw the hash marks for each of the grains
    // If not, move the rows up (i.e. if showing year-month-day but removing the days, move year and month up
    // a row)
    for (i = 0; i < tickGroups.length; i++) {
      tickGroup = tickGroups[i];
      if (i === tickGroups.length - 1) {
        continue;
      } // Have to draw hashes if its the only row
      if (tickGroup.ticks.length > this.props.scale.dy / PIXELS_BETWEEN_HASHES) {
        tickGroup.dontDrawHashes = true;
      }
    }

    // @y is the total height of the time axis
    // TODO: Store in state, not as instance var
    this.y = this.hashLengthForRow(_.last(tickGroups).row);

    for (tickGroup of Array.from(tickGroups)) {
      ({ ticks, grain, row } = tickGroup);
      for (tick of Array.from(ticks)) {
        tick.grain = grain;
        tick.key = this.formatKeyForTick(tick);
      }
    }

    /*
    Figure out the truncateIndex for each group.  This is the level to which
    their label needs to be abbreviated (like "January" --> "Jan" --> "J" --> "").  All ticks in a
    group  will be truncated to the same level of abbreviation, for example... if September needs to be written as
    just "Sep", but "March" can fit fine as it is, we still chop down "March" to "Mar" for consistency.)
    */
    for (groupIndex = 0; groupIndex < tickGroups.length; groupIndex++) {
      tickGroup = tickGroups[groupIndex];
      ({ ticks } = tickGroup);

      // TODO: the space for each tick is NOT uniform, as we assume here.  The first and last tick can have less space.
      const spacePerTick = this.props.scale.dy / ticks.length;
      const maxWidth = spacePerTick - 2 * LABEL_PADDING; // max amt of possible space for each tick label
      if (maxWidth < 10) {
        tickGroup.labelsCannotFit = true;
      }

      let largestTruncation = 0; // the level to which we will abreviate each lable in group
      widthOfLargest = 0;
      fontSize = FONT_LARGEST_TIME_AXIS; // we dont yet know, so be conservative

      for (tickIndex = 0; tickIndex < ticks.length; tickIndex++) {
        tick = ticks[tickIndex];
        truncateIndex = -1;
        let textIsntCollapsed = true;
        let textFitsInMaxSpace = false;
        while (textIsntCollapsed && !textFitsInMaxSpace) {
          truncateIndex++;
          if (!(text = this.formatTimeAxisLabel(tick, truncateIndex))) {
            textIsntCollapsed = false;
            truncateIndex--;
          } else {
            ({ width } = this.getTextMetrics(text, fontSize).lines[0]);
            textFitsInMaxSpace = width <= maxWidth;
          }
        }

        widthOfLargest = Math.max(width, widthOfLargest);
        largestTruncation = Math.max(truncateIndex, largestTruncation);
      }

      tickGroup.widthOfLargest = widthOfLargest;
      tickGroup.truncateIndex = largestTruncation;
    }

    // Remove the tick groups that are too dense to draw.  Make sure to leave at least one group.
    let groupsRemoved = 0;
    while (tickGroups[0].labelsCannotFit && tickGroups[0].dontDrawHashes && groupsRemoved < POSSIBLE_GRAINS.length) {
      groupsRemoved++;
      tickGroups.splice(0, 1);
    }

    tickGroups = tickGroups.slice(0, 3); // we only want a max of three granularities

    // We now know exactly how many groups we will render
    for (i = 0; i < tickGroups.length; i++) {
      tickGroup = tickGroups[i];
      row = i + 1; // note: not 0 indexed
      numRows = tickGroups.length;
      tickGroup.row = row;
      tickGroup.numRows = numRows;
      for (tick of Array.from(tickGroup.ticks)) {
        tick.row = row;
        tick.numRows = numRows;
      }
    }

    // Now that we know how much all the ticks must be truncated, we have to actually
    // iterate over them and see which ones we can draw (can have positive width)
    const innerTicksToDraw = []; // will eventually be added to axisLabels
    for (groupIndex = 0; groupIndex < tickGroups.length; groupIndex++) {
      tickGroup = tickGroups[groupIndex];
      ({ ticks, row, numRows, truncateIndex, grain } = tickGroup);
      if (tickGroup.labelsCannotFit || groupIndex === tickGroups.length - 1) {
        continue;
      } // outermost group is done separately
      fontSize = this.getFontSize(row, numRows);
      for (tickIndex = 0; tickIndex < ticks.length; tickIndex++) {
        tick = ticks[tickIndex];
        text = this.formatTimeAxisLabel(tick, truncateIndex);
        if (!text) {
          continue;
        } // we won't display them at all because there's no space
        textWidth = this.getTextMetrics(text, fontSize).lines[0].width;
        $.extend(tick, {
          text,
          fontSize,
          width: textWidth
        });
        tick = this.formatTickLayout(tick);
        if (tick.x + textWidth > this.props.scale.dy) {
          continue;
        } // don't draw it if the label goes over the chart width
        innerTicksToDraw.push(tick);
      }
    }

    const hashByKey = {}; // will eventually be added to axisHashes
    i = tickGroups.length;
    while (i > 0) {
      tickGroup = tickGroups[i - 1];
      if (tickGroup.dontDrawHashes || i === tickGroups.length) {
        // outtermost handled separately
        i--;
        continue;
      }
      for (tickIndex = 0; tickIndex < tickGroup.ticks.length; tickIndex++) {
        tick = tickGroup.ticks[tickIndex];
        this.addHashMarkFromTick(tick, hashByKey, this.props.scale, false);
      }
      i--;
    }

    // For outer most ticks, figure out how many to skip (if not enough space for all)
    const outerMostTickGroup = _.last(tickGroups);
    let numToSkip = 1; // will represent the number of ticks to not label in order to fit them
    const largest = outerMostTickGroup.widthOfLargest;
    while ((largest + 2 * LABEL_PADDING) * (outerMostTickGroup.ticks.length / numToSkip) > this.props.scale.dy * 0.7) {
      // some padding
      numToSkip++;
    }

    // Now we need to pluck a bunch of tick marks out so that there are gaps
    // between each tick mark that we draw. That gap should be n tick marks wide.
    let numberSkippedInARow = 0;
    const outerTicksToDraw = []; // will eventually be added to axisLabels
    ({ row, grain } = outerMostTickGroup);
    fontSize = this.getFontSize(row, tickGroups.length);
    const fontRatio = fontSize / 12; // standard size
    for (let index = 0; index < outerMostTickGroup.ticks.length; index++) {
      tick = outerMostTickGroup.ticks[index];
      if (numberSkippedInARow < numToSkip && numToSkip !== 1 && index !== 0) {
        // we haven't made n ticks invisible yet, so dont draw this one
        numberSkippedInARow++;
      } else {
        numberSkippedInARow = 0; // need to skip the next n ticks since we're drawing this one
        this.addHashMarkFromTick(tick, hashByKey, this.props.scale, true);
        text = this.formatTimeAxisLabel(tick, 0); // dont truncate the outermost text
        textWidth = fontRatio * this.getTextMetrics(text, fontSize).lines[0].width;
        tick = this.formatTickLayout(tick);
        $.extend(tick, {
          text,
          fontSize
        });
        if (tick.x + textWidth > this.props.scale.dy) {
          continue;
        } // don't draw the label if it goes over the edge
        tick.width = textWidth;
        outerTicksToDraw.push(tick);
      }
    }

    // push in our shapes
    axisHashes = (() => {
      const result = [];
      for (const epoch in hashByKey) {
        const hash = hashByKey[epoch];
        result.push(this.formatHashMarkLayout(hash));
      }
      return result;
    })(); // the vert lines
    axisLabels = axisLabels.concat(outerTicksToDraw).concat(innerTicksToDraw);
    return {
      axisHashes,
      axisLabels
    };
  }

  // Given a time range, produces a sequence of tick marks at incrementing dates.
  // It only does it for one grain at a time (i.e. "year"). So if you want to show multiple
  // grains, run this function for each grain.
  ticksForGrain(grain, timeScale) {
    let time;
    const { domain } = timeScale;
    const [startEpoch, endEpoch] = Array.from(domain);

    // Always push the first tick. Then push ticks that are rounded to nearest grain.
    const ticks = [ // the array to populate with all of the time axis tick marks
      {
        date: new Date(startEpoch),
        grain
      }];

    // This is the date we will increment
    const pointer = DateUtils.roundDateToGrain(new Date(startEpoch), grain);
    const incrementer = DateUtils.incrementerForGrain[grain];
    let numTicks = 0;
    while ((time = pointer.getTime()) <= endEpoch) {
      if (time < startEpoch) {
        incrementer(pointer);
        continue;
      }
      ticks.push({
        date: new Date(time),
        grain
      });
      incrementer(pointer);
      numTicks++;
      if (numTicks >= 500) {
        return false;
      }
    } // Never a need to show 500 axis marks.  This enhances performance.

    return ticks;
  }

  //--------------------------------------------------------------------------------
  // Styling
  //--------------------------------------------------------------------------------

  getFontSize(row, numRows) {
    if (row === numRows) {
      return FONT_LARGEST_TIME_AXIS;
    } else if (row === 1) {
      return FONT_LARGEST_TIME_AXIS - 4;
    } else if (row === 2) {
      return FONT_LARGEST_TIME_AXIS - 3;
    } else {
      return FONT_LARGEST_TIME_AXIS;
    }
  }

  // The Y length of a hash mark
  hashLengthForRow(row) {
    return SMALLEST_HASH_MARK * row;
  }

  getX(shape, timeScale, centerText) {
    let date,
      epoch;
    if (timeScale == null) {
      timeScale = this.props.scale;
    }
    const isLabel = this.typeOfShapeFromKey(shape.key) === 'tick';
    if (isLabel) {
      let grain, width;
      ({ date, grain, width } = shape);
      epoch = date.getTime();
      if (centerText) {
        const middleEpoch = DateUtils.midPointOfGrain(date, grain).getTime();
        const centerInPixels = timeScale.map(middleEpoch);
        return centerInPixels - width / 2;
      } else {
        return timeScale.map(epoch) + LABEL_PADDING; // some padding
      }
    } else {
      epoch = shape.date.getTime();
      return timeScale.map(epoch);
    }
  }

  // returns the type of the shape (based on the key). Could be a tick or a hash.
  typeOfShapeFromKey(key) {
    const parts = key.split(KEY_DIVIDER);
    return parts[0];
  }

  // ----------------------------------------------
  // Shape creation
  // ----------------------------------------------

  addHashMarkFromTick(tick, hashMap, timeScale, shouldOverride) {
    if (shouldOverride == null) {
      shouldOverride = false;
    }
    const tickHash = $.extend({}, tick);
    const epoch = tick.date.getTime();
    const hashKey = this.formatKeyForHashMark(tickHash);
    if (!shouldOverride && hashMap[epoch]) {
      return;
    } // dont draw if there's already a tick on that spot
    hashMap[epoch] = tickHash; // may override a previous one, which is good
    tickHash.key = hashKey;
    tickHash.x = timeScale.map(tickHash.date.getTime());
  }

  formatTickLayout(tick) {
    return $.extend(tick, {
      y: this.hashLengthForRow(tick.row) - 13, // kind of hacky to hard code this offset
      x: this.getX(tick)
    });
  }

  // Formats positions for the vert lines on the time axis
  formatHashMarkLayout(tickHash) {
    const x = this.getX(tickHash);
    return $.extend(tickHash, {
      x,
      y0: 0,
      y1: this.hashLengthForRow(tickHash.row)
    });
  }

  // ----------------------------------------------
  // Text measuring, abbreviation, etc.
  // ----------------------------------------------

  getTextMetrics(text, fontSize) {
    const availableWidth = 200; // Somewhat arbitrary, this should be based on axis width
    return measureText(text, availableWidth, FONT_FACE, fontSize, fontSize);
  }

  /*
  This formats the labels on the time line axis
  arguments:
    tick:
      Info for the mark on the time axis (the date, the scale -- like "year")
    truncateIndex:
      How much we need to abbreviate the text by (its an integer)
  */
  formatTimeAxisLabel(tick, truncateIndex) {
    if (truncateIndex == null) {
      truncateIndex = 0;
    }
    const { date, grain } = tick;
    const dateObj = DateUtils.timeToDateObj(date.getTime());

    const val = (() => {
      let formatter;
      if (formatter = formatLabelByGrain[grain]) {
        return formatter(truncateIndex, dateObj);
      } else {
        // the default formatting
        switch (truncateIndex) {
          case 0:
            return dateObj[grain];
        }
      }
    })();
    if (val) {
      return val.toString();
    } else {
      return undefined;
    }
  }

  formatKeyForTick(tick) {
    return ['tick', tick.grain, `${tick.date.getTime()}`].join(KEY_DIVIDER);
  }

  formatKeyForHashMark(hash) {
    return ['hash', hash.grain, `${hash.date.getTime()}`].join(KEY_DIVIDER);
  }
}

export default TimeAxis;
