import _         from 'lodash';
import Urls      from 'main/util/urls';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import trace from 'main/util/trace';

const util = {
  mousePositionFor(ev, domNode) {
    const rect = domNode.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top
    };
  }
};

class Solution {
  constructor(warps) {
    this.warps = warps;
    this.warpsById = {};
    Array.from(this.warps).forEach((w) => {
      this.warpsById[w.id] = w;
      w.reported_started_at_ms = +Moment(w.reported_started_at);
      w.reported_completed_at_ms = +Moment(w.reported_completed_at);
      Array.from(w.warp_events).forEach((ev) => {
        ev.created_at_ms = +Moment(ev.created_at);
      });
      // TODO[jca]: We should probably also include reported_started_at /
      // reported_completed_at in the extent calculation, but at present the
      // timestamps in reported_started_at/completed_at don't perfectly line up
      // with the warp event timestamps, since the latter are annotated by the
      // web app and the former are annotated by TCLE. We treat the web app as
      // authoritative here because we don't have any other source of truth for
      // the time of warp state changes. The fix for this is to have TCLE
      // annotate a timestamp when it assembles the warp state change message,
      // and for the web app to record that timestamp instead of making a new
      // one when it received the message.
      const all_times = w.warp_events.map(ev => ev.created_at_ms);
      w.extent_min_ms = Math.min(...all_times);
      w.extent_max_ms = Math.max(...all_times);
    });
  }

  warp(id) {
    return this.warpsById[id];
  }

  extentForWarp(id) {
    const w = this.warp(id);
    return {
      start: w.extent_min_ms,
      end: w.extent_max_ms
    };
  }

  duration() {
    const starts = this.warps.map(w => w.extent_min_ms);
    const ends = this.warps.map(w => w.extent_max_ms);
    const alls = starts.concat(ends);
    const earliest = Math.min(...alls);
    const latest = Math.max(...alls);
    return latest - earliest;
  }

  extent() {
    const starts = this.warps.map(w => w.extent_min_ms);
    const ends = this.warps.map(w => w.extent_max_ms);
    const alls = starts.concat(ends);
    const earliest = Math.min(...alls);
    const latest = Math.max(...alls);
    return {
      minTime: earliest,
      maxTime: latest
    };
  }
}

// Renders a time-based Gantt-style view of a solution.
class ScheduleView extends React.Component {
  constructor(props) {
    super(props);
    this.RowHeight = 20;

    const s = this.solution();
    let scale = s.duration() / (this.props.width - 150);
    // Minimum initial scale at 1000 ms/px.
    scale = Math.max(scale, 1000);

    this.state = {
      offset: (-scale * 100) + s.extent().minTime,
      scale,
      now: Moment()
    };

    _.bindAll(
      this,
      'onWheel',
      'onDrag',
      'onMouseUp',
      'onMouseDown',
      'onMouseMove',
      'onMouseLeave',
      'paintTimeScale',
      'paintSchedule',
      'paint',
      'windowMouseDown'
    );
  }

  componentDidMount() {
    window.addEventListener('mousedown', this.windowMouseDown);
    this.paint();
  }

  componentDidUpdate() {
    this.paint();
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.windowMouseDown);
  }

  onWheel(e) {
    e.preventDefault();
    const { x } = util.mousePositionFor(e, this.node);
    let { scale } = this.state;
    // Cribbed from d3:
    // https://github.com/mbostock/d3/blob/30431b15ffa4f9b1871ba8199dcb86fda21f06a1/src/behavior/zoom.js#L331
    const scaleChange = 2 ** (e.deltaY * 0.002);
    const oldScale = scale;
    scale *= scaleChange;
    scale = Math.min(
      scale,
      this.solution().duration() / (this.props.width / 2)
    );
    scale = Math.max(scale, 1); // Don't zoom in closer than 1 ms/px
    const limitedScaleChange = scale / oldScale;
    const offset = this.clampOffset(
      this.state.offset + ((1 - limitedScaleChange) * x * this.state.scale),
      scale
    );
    this.setState({
      offset,
      scale
    });
  }

  onDrag(e) {
    e.preventDefault();
    const { x } = util.mousePositionFor(e, this.node);
    const dx = x - this.state.lastX;
    if (this.state.dragging || Math.abs(dx) >= 5) {
      const newOffset = this.xToTime(this.timeToX(this.state.offset) - dx);
      this.setState({
        offset: this.clampOffset(newOffset),
        lastX: x,
        dragging: true
      });
    }
  }

  onMouseUp(e) {
    if (e.target !== this.canvas && !this.state.dragging) {
      return;
    }
    e.preventDefault();
    this.setState({
      lastX: undefined
    });
    if (!this.state.dragging) {
      this.setState({
        selectedWarpId: this.state.hoveredWarpId
      });
    }
    window.removeEventListener('mousemove', this.onDrag);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onMouseDown(e) {
    if (e.target !== this.canvas) {
      return;
    }
    e.preventDefault();
    const { x } = util.mousePositionFor(e, this.node);
    this.setState({
      lastX: x,
      dragging: false
    });
    window.addEventListener('mousemove', this.onDrag);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove(e) {
    const { x, y } = util.mousePositionFor(e, this.node);
    let cursor;
    let warpId;
    this.hit(x * devicePixelRatio, y * devicePixelRatio, (h) => {
      cursor = h.cursor != undefined ? h.cursor : cursor;
      warpId = h.warpId;
    });

    this.node.style.cursor = cursor;
    this.setState({
      hoveredWarpId: warpId
    });
  }

  onMouseLeave() {
    this.node.style.cursor = undefined;
    this.setState({
      hoveredWarpId: undefined
    });
  }

  solution() {
    if (this._soln == undefined) {
      this._soln = new Solution(this.props.warps);
    }
    return this._soln;
  }

  timeToX(t) {
    return (t - this.state.offset) / this.state.scale;
  }

  xToTime(x) {
    return (x * this.state.scale) + this.state.offset;
  }

  devices() {
    const devices = {};
    this.props.warps.forEach((w) => { devices[w.device_id] = true; });
    return Object.keys(devices);
  }

  paint() {
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    try {
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.clearRect(0, 0, this.props.width, this.canvas.height);
      return trace.withContext(ctx, this.paintSchedule);
    } finally {
      ctx.restore();
    }
  }

  hit(x, y, fn) {
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    try {
      ctx.scale(devicePixelRatio, devicePixelRatio);
      return trace.withContext(ctx, () => {
        return trace.hit(x, y, this.paintSchedule, fn);
      });
    } finally {
      ctx.restore();
    }
  }

  windowMouseDown(e) {
    if (!this.node.contains(e.target)) {
      this.setState({
        hoveredWarpId: undefined,
        selectedWarpId: undefined
      });
    }
  }

  clampOffset(offset, scale = this.state.scale) {
    let { maxTime, minTime } = this.solution().extent();
    minTime -= (this.props.width / 2) * scale;
    maxTime -= (this.props.width / 2) * scale;
    return Math.max(minTime, Math.min(offset, maxTime));
  }

  paintSchedule() {
    this.paintTimeScale();
    return trace.group(
      {
        y: this.RowHeight + 0.5
      },
      () => {
        this.paintDeviceLanes();
        return this.paintWarps();
      }
    );
  }

  paintDeviceLanes() {
    const stateForDevice = (deviceId) => {
      const foundWarp = _.find(Array.from(this.props.warps), (w) => {
        return w.device_id === deviceId && !['Upcoming', 'Completed'].includes(w.state);
      });

      return foundWarp ? foundWarp.state : 'Upcoming';
    };

    const fillColor = (dev, i) => {
      switch (stateForDevice(dev)) {
        case 'Enabled':
        case 'Running':
          return `hsl(113, 100%, ${[90, 92][i % 2]}%)`;
        case 'Failed':
          return 'hsl(0, 100%, 90%)';
        default:
          return `hsl(240, 100%, ${[98, 97][i % 2]}%)`;
      }
    };

    this.devices().forEach((device, i) => {
      const fill = fillColor(device, i);
      trace.rect({
        width: this.props.width,
        height: this.RowHeight,
        x: 0,
        y: i * this.RowHeight,
        fill
      });
    });
  }

  paintTimeScale() {
    // pick the smallest tick size we can show
    const tickSizes = [
      1,
      10,
      60, // seconds
      5 * 60,
      10 * 60,
      30 * 60, // minutes
      1 * 60 * 60,
      2 * 60 * 60,
      4 * 60 * 60,
      8 * 60 * 60,
      12 * 60 * 60,
      24 * 60 * 60 // hours
    ]
      .concat(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
          pwr => 24 * 60 * 60 * (10 ** pwr)
        )
      )
      .map(x => x * 1000);
    // tickSize : ms/tick
    // @state.scale : ms/px
    const minPixelsBetweenTicks = 50;

    let tickSizePx;
    let tickIndex;
    let tickSize;

    tickSizes.every((size, i) => {
      tickSizePx = size / this.state.scale; // px/tick
      tickIndex = i;
      tickSize = size;
      return !(tickSizePx >= minPixelsBetweenTicks);
    });
    const smallerTickSize = tickSizes[tickIndex - 1];
    const canvasWidthPx = this.props.width;
    const canvasWidthMs = canvasWidthPx * this.state.scale; // ms
    // generate n+2 ticks, where n is the number of ticks that would fit on the screen
    const numTicks = Math.ceil(canvasWidthMs / tickSize) + 2;
    // what time is the left of the screen at?
    const firstTick = Math.floor(this.xToTime(0) / tickSize);

    _.range(0, numTicks).forEach((i) => {
      const timeOfThisTick = (firstTick + i) * tickSize;
      const xOfThisTick = this.timeToX(timeOfThisTick);
      const text =
        tickSize < 60 * 1000
          ? Moment(timeOfThisTick).format('HH:mm:ss')
          : Moment(timeOfThisTick).format('HH:mm');
      trace.shape(
        {
          stroke: 'black'
        },
        (ctx) => {
          ctx.moveTo(xOfThisTick, 0);
          return ctx.lineTo(xOfThisTick, 5);
        }
      );

      _.range(1, Math.floor(tickSize / smallerTickSize)).forEach((j) => {
        const subtickTime = timeOfThisTick + (j * smallerTickSize);
        const xOfSubtick = this.timeToX(subtickTime);
        trace.shape(
          {
            stroke: 'black'
          },
          (ctx) => {
            ctx.moveTo(xOfSubtick, 0);
            return ctx.lineTo(xOfSubtick, 2);
          }
        );
      });

      trace.text(
        {
          fill: 'black',
          x: xOfThisTick,
          y: 2,
          font: '12px Helvetica'
        },
        text
      );
    });
  }

  colorForState(s) {
    switch (s) {
      case 'Enabled':
        return 'orange';
      case 'Running':
        return 'lightgreen';
      case 'Failed':
        return 'red';
      case 'Completed':
        return 'gray';
      default:
        return 'transparent';
    }
  }

  paintWarps() {
    const devices = this.devices();
    const solution = this.solution();

    const warpOfInterest = this.state.hoveredWarpId || this.state.selectedWarpId;

    // Draw warp rectangles.
    Object.keys(solution.warpsById).forEach((id) => {
      const w = solution.warpsById[id];
      const row = devices.indexOf(w.device_id);
      const { start, end } = solution.extentForWarp(id);
      const startX = this.timeToX(start);
      const endX = this.timeToX(end);
      if (startX <= this.props.width && endX >= 0) {
        const isHovered = warpOfInterest && id === warpOfInterest;
        const isParent =
          warpOfInterest &&
          Array.from(
            (solution.warp(warpOfInterest) ? solution.warp(warpOfInterest).parents : undefined) || []
          ).includes(id);
        const isChild =
          warpOfInterest &&
          Array.from(
            (solution.warp(id) ? solution.warp(id).parents : undefined) || []
          ).includes(warpOfInterest);
        const isBoring = warpOfInterest && !isHovered && !isParent && !isChild;
        const boringColor = isBoring ? 'gray' : 'black';
        const strokeColor = isHovered ? 'deeppink' : boringColor;
        // Bumping the strokeWidth up to 2 for the hovered warp means we have to
        // also tweak the x/y/width/height to keep things pixel-perfect and
        // avoid blurry antialiasing.
        trace.rect({
          warpId: id,
          stroke: strokeColor,
          strokeWidth: isHovered ? 2 : 1,
          fill: 'white',
          x: startX + (isHovered ? -0.5 : 0),
          y: (row * this.RowHeight) + 3 + (isHovered ? -0.5 : 0),
          cursor: 'pointer',
          width: (endX - startX) + (isHovered ? 1 : 0),
          height: (this.RowHeight - 6) + (isHovered ? 1 : 0)
        });
        let state;
        let state_changed_at;
        Array.from(w.warp_events).forEach((ev) => {
          if (state != undefined) {
            trace.rect({
              warpId: id,
              fill: this.colorForState(state),
              x: this.timeToX(state_changed_at),
              y: ((row * this.RowHeight) + 4) - 0.5,
              width:
                this.timeToX(ev.created_at_ms) - this.timeToX(state_changed_at),
              height: (this.RowHeight - 8) + 1
            });
          }
          state = ev.warp_state;
          state_changed_at = ev.created_at_ms;
        });
      }
    });
  }

  paintNow() {
    return trace.shape(
      {
        stroke: 'red'
      },
      (ctx) => {
        ctx.moveTo(this.timeToX(this.state.now), 0);
        return ctx.lineTo(
          this.timeToX(this.state.now),
          this.RowHeight * (1.5 + this.devices().length)
        );
      }
    );
  }

  renderDeviceNames() {
    return (
      <div className="device-names">
        {Array.from(this.devices()).map((dev, i) => {
          return (
            <div
              className="device-name"
              key={dev.id}
              style={{
                position: 'absolute',
                top: (i + 1) * this.RowHeight,
                left: 2,
                textShadow:
                  '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
                font: '12px Helvetica',
                height: this.RowHeight,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <a href={Urls.logURL(dev)} title={`Logs for ${dev}`} target="_blank" rel="noreferrer">
                {dev}
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  renderWarpJSON(solution) {
    if (this.state.hoveredWarpId || this.state.selectedWarpId) {
      const warp = solution.warp(this.state.hoveredWarpId || this.state.selectedWarpId);

      if (warp) {
        const { start } = solution.extentForWarp(warp.id);
        return (
          <div
            className="warp-overlay"
            style={{
              aposition: 'absolute',
              top: (this.devices().length + 1) * this.RowHeight,
              left: 2 + Math.max(0, this.timeToX(start)),
              zIndex: 1
            }}
          >
            <pre>
              {JSON.stringify(warp, undefined, 2)}
            </pre>
          </div>
        );
      }
    }

    return undefined;
  }

  render() {
    const { width } = this.props;
    const height = (this.devices().length + 1) * this.RowHeight;
    const s = this.solution();
    return (
      <div
        style={{
          position: 'relative'
        }}
        className="schedule-view"
        ref={(node) => { this.node = node; }}
      >
        <canvas
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onWheel={this.onWheel}
          style={{
            cursor: this.state.lastX != undefined ? 'move' : undefined,
            width,
            height
          }}
          ref={(node) => { this.canvas = node; }}
          width={width * devicePixelRatio}
          height={height * devicePixelRatio}
        />
        {this.renderDeviceNames()}
        {this.renderWarpJSON(s)}
      </div>
    );
  }
}

ScheduleView.defaultProps = {
  width: 800
};

ScheduleView.propTypes = {
  width: PropTypes.number,
  warps: PropTypes.array
};

export default ScheduleView;
