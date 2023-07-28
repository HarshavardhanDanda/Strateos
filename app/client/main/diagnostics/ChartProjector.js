import _               from 'lodash';

import Style from 'main/diagnostics/Style';
import LinearScale from './charting/LinearScale';

// 2D data charting utility
class ChartProjector {
  // TODO
  // 1) Enforce the required/optional args in the constructor
  // 2) The axis orientation should be encoded here.  This will
  //    allow this component to know to project into neg/pos direction

  /*
    data       array   required   Objects with {xField, yField} keys
    xField     string  required   Name of x axis key in @data
    yField     string  required   Name of y axis key in @data
    origin     {x,y}   required   Pixel value of origin {x, y}
    width      int     required   Chart width in pixels, including padding
    height     int     required   Chart height in pixels, including padding
    xDomain    array   optional   Override the x scale, otherwise inferred from data
    yDomain    array   optional   Override the y scale, otherwise inferred from data
    includeInY array   optional   Expand y domain to include this range
    includeInX array   optional   Expand x domain to include this range
  */
  constructor({
    data,
    xField,
    yField,
    origin,
    width,
    height,
    xDomain,
    yDomain,
    includeInY,
    includeInX
  }) {
    this.data    = data;
    this.xField  = xField;
    this.yField  = yField;
    this.origin  = origin;
    this.width   = width;
    this.height  = height;
    this.xDomain = xDomain;
    this.yDomain = yDomain;

    this.pointArrToHash = this.pointArrToHash.bind(this);

    if (this.yDomain == undefined) {
      this.yDomain = this.minMaxForScale(_.map(this.data, this.yField));
    }
    if (includeInY) {
      this.yDomain = this.includeRange(includeInY, this.yField);
    }

    if (this.xDomain == undefined) {
      this.xDomain = this.minMaxForScale(_.map(this.data, this.xField));
    }
    if (includeInX) {
      this.xDomain = this.includeRange(includeInX, this.xField);
    }

    this._xScale = this.getXScale();
    this._yScale = this.getYScale();
  }

  // TODO Handle OrdinalScales as well
  getYScale() {
    if (this._yScale) {
      return this._yScale;
    }

    // There's no axis on top so we only need base padding
    const yAxisLength = this.height - Style.axisSize - Style.chartPadding;

    this._yScale = new LinearScale({
      domain: this.yDomain,
      range: [0, yAxisLength]
    });

    return this._yScale;
  }

  getXScale() {
    if (this._xScale) {
      return this._xScale;
    }

    const xAxisLength = this.width - (2 * Style.axisSize);

    this._xScale = new LinearScale({
      domain: this.xDomain,
      range: [0, xAxisLength]
    });

    return this._xScale;
  }

  getProjectedValues(data) {
    const defaultedData = data || this.data;

    const xScale = this.getXScale();
    const yScale = this.getYScale();

    this._projectedPoints = defaultedData.map((point) => {
      return {
        x: xScale.map(point[this.xField]) + this.origin.x,
        y: -yScale.map(point[this.yField]) + this.origin.y
      };
    });

    return this._projectedPoints;
  }

  pointArrToHash([x, y]) {
    const point        = {};
    point[this.yField] = y;
    point[this.xField] = x;

    return point;
  }

  minMaxForScale(data) {
    return [_.min(data), _.max(data)];
  }

  // Increase the range of one of the axis of the data
  // to include the values in the `range` arg.
  includeRange(range, field) {
    const [minData, maxData] = this.minMaxForScale(
      _.map(this.data, field)
    );

    return [Math.min(minData, range[0]), Math.max(maxData, range[1])];
  }
}

export default ChartProjector;
