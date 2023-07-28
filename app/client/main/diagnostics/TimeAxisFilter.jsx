import PropTypes                 from 'prop-types';
import React                     from 'react';
import ReactSlider               from 'react-slider';

import ChartHOC from 'main/diagnostics/ChartHOC';
import LinearScale from 'main/diagnostics/charting/LinearScale';
import TimeAxis from 'main/diagnostics/charting/TimeAxis';
import Surface from 'main/diagnostics/charting/Surface';
import Style from 'main/diagnostics/Style';

// Renders a slider component on top of a canvas time axis
class TimeAxisFilter extends React.Component {
  constructor(props) {
    super(props);
    this.onGetNode = this.onGetNode.bind(this);
  }

  getTimeScale() {
    return new LinearScale({
      domain: this.props.fullTimeRange,
      range: [0, this.props.width]
    });
  }

  onGetNode(node, scale = 1) {
    this.node = node;
    this.scale = scale;
    this.paint();
  }

  paint() {
    const ctx = this.node.getContext('2d');
    const { width, height } = this.props;
    const scale = this.scale;

    /*
      Setup canvas and clear a rect
    */
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width * scale, height * scale);

    const textStyle = Style.axisTextStyle();
    const axisStyle = Style.defaultAxisLineStyle();

    const timeAxis = new TimeAxis({
      ctx: ctx,
      canvasScale: scale,
      origin: { x: 0, y: 0 },
      axis: 'x',
      direction: 'right',
      placement: 'below',
      scale: this.getTimeScale(),
      textStyle: textStyle,
      axisLineStyle: axisStyle
    });
    timeAxis.render();

    ctx.restore();
  }

  render() {
    if (this.props.width == undefined || !this.props.height == undefined) {
      return <div />;
    }
    const { fullTimeRange, sliderValue, width, height } = this.props;

    return (
      <div className="time-slider">
        <ReactSlider
          min={fullTimeRange[0]}
          max={fullTimeRange[1]}
          defaultValue={fullTimeRange}
          value={sliderValue != undefined ? sliderValue : fullTimeRange}
          onAfterChange={this.props.onAfterChange}
          onChange={this.props.onChange}
        />
        <Surface
          width={width}
          height={height}
          onGetNode={this.onGetNode}
        />
      </div>
    );
  }
}

TimeAxisFilter.propTypes = {
  fullTimeRange: PropTypes.array.isRequired, // start/end epochs of the unfiltered time range
  sliderValue: PropTypes.array, // the filtered time range
  onAfterChange: PropTypes.func,
  onChange: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number
};

export default ChartHOC(TimeAxisFilter);
