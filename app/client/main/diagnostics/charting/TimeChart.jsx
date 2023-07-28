import React from 'react';
import PropTypes from 'prop-types';

import Style from 'main/diagnostics/Style';
import ChartProjector from 'main/diagnostics/ChartProjector';
import TimeAxis from 'main/diagnostics/charting/TimeAxis';
import Axis from 'main/diagnostics/charting/Axis';
import Surface from 'main/diagnostics/charting/Surface';
import { drawMultiLine } from 'main/diagnostics/charting/drawing';

class TimeChart extends React.Component {
  constructor(props) {
    super(props);
    this.onGetNode = this.onGetNode.bind(this);
  }

  paint() {
    const { width, height, projector, labelForTick } = this.props;
    const scale = this.scale;
    const ctx = this.node.getContext('2d');

    /*
      Setup canvas and clear a rect
    */
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width * scale, height * scale);

    const projectionScale = projector.getYScale();
    const textStyle = Style.axisTextStyle();
    const axisStyle = Style.defaultAxisLineStyle();

    // Render Y axis
    const axis = new Axis({
      ctx: ctx,
      canvasScale: scale,
      origin: projector.origin,
      thickness: projector.origin.x,
      axis: 'y',
      direction: 'up',
      placement: 'left',
      scale: projectionScale,
      otherAxisLength: projectionScale.dy,
      labelForTick: labelForTick,
      textStyle: textStyle,
      axisLineStyle: axisStyle
    });
    axis.render();

    // Render X axis
    const timeAxis = new TimeAxis({
      ctx: ctx,
      canvasScale: scale,
      origin: projector.origin,
      axis: 'x',
      direction: 'right',
      placement: 'below',
      scale: projector.getXScale(),
      textStyle: textStyle,
      axisLineStyle: axisStyle
    });
    timeAxis.render();

    this.paintPoints(ctx, axisStyle);

    ctx.restore();
  }

  paintPoints(ctx, axisStyle) {
    const { projector } = this.props;
    const points = projector.getProjectedValues();

    // First render the line
    const lineStyle = {
      strokeStyle: axisStyle.strokeStyle,
      fillStyle: axisStyle.strokeStyle,
      lineWidth: `${axisStyle.lineWidth}px`
    };
    drawMultiLine(ctx, points, { style: lineStyle }, this.scale);

    // Now draw points
    const radius = 5;
    ctx.save();
    ctx.strokeStyle = 'black';
    if (points.length < 100) {
      points.forEach((point) => {
        const { x, y } = point;
        ctx.beginPath();
        ctx.arc(
          Math.round(x) * this.scale,
          Math.round(y) * this.scale,
          radius,
          0,
          Math.PI * 2,
          true
        );
        ctx.stroke();
        ctx.closePath();
      });
    }
    ctx.restore();
  }

  onGetNode(node, scale = 1) {
    this.node = node;
    this.scale = scale;
    this.paint();
  }

  render() {
    const { width, height } = this.props;
    return (
      <Surface
        width={width}
        height={height}
        onGetNode={this.onGetNode}
      />
    );
  }
}

TimeChart.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  projector: PropTypes.instanceOf(ChartProjector),
  labelForTick: PropTypes.func
};

export default TimeChart;
