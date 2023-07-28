import Immutable   from 'immutable';
import PropTypes   from 'prop-types';
import React       from 'react';

import ChartProjector from 'main/diagnostics/ChartProjector';
import ChartSelector from 'main/diagnostics/ChartSelector';
import ChartHOC from 'main/diagnostics/ChartHOC';

import TimeChart from 'main/diagnostics/charting/TimeChart';

// Generic time series chart that renders sensor data
class SensorDataChart extends React.Component {
  static formatterForType(sensorType) {
    switch (sensorType) {
      case 'blockTemp':
      case 'lidTemp':
      case 'temperature':
      case 'pressure':
        return temp => `${temp.toFixed(2)}`;
      case 'gForce':
        return gForce => `${gForce.toFixed(1)}`;
      default:
        return val => val;
    }
  }

  render() {
    if (this.props.width === undefined || this.props.height == undefined) {
      return <div />;
    }

    //
    // TODO This projector should be cached because data.toJS() is expensive!
    //
    const projector = new ChartProjector({
      data: this.props.data.toJS(),
      xField: 'time',
      yField: 'value',
      origin: this.props.origin,
      width: this.props.width,
      height: this.props.height,
      includeInX: this.props.includeInX || this.props.epochRange,
      includeInY: this.props.includeInY || this.props.targetRange
    });

    return (
      <div className="chart-wrapper">
        <If condition={this.props.didSelectRange}>
          <ChartSelector
            projector={projector}
            onSelectRange={this.props.didSelectRange}
          />
        </If>
        <TimeChart
          width={this.props.width}
          height={this.props.height}
          projector={projector}
          labelForTick={SensorDataChart.formatterForType(this.props.sensorType)}
        />
      </div>
    );
  }
}

SensorDataChart.propTypes = {
  data: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  sensorType: PropTypes.string.isRequired,
  didSelectRange: PropTypes.func,
  epochRange: PropTypes.array.isRequired,
  targetRange: PropTypes.array,
  includeInX: PropTypes.array,
  includeInY: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  origin: PropTypes.object
};

export { SensorDataChart };
export default ChartHOC(SensorDataChart);
