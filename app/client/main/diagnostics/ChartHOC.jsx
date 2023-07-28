import React from 'react';
import _ from 'lodash';
import $ from 'jquery';

import Style from 'main/diagnostics/Style';

const ChartHOC = (ChartComponent) => {
  // Utilites for dynamic charts, like resizing on viewport size change
  return class ChartResizeWrapper extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        width: undefined,
        height: undefined,
        origin: undefined
      };

      this.setChartDimensions = this.setChartDimensions.bind(this);
    }

    componentDidMount() {
      this.debouncedSetChartDimensions = _.debounce(this.setChartDimensions, 300);
      window.addEventListener('resize', this.debouncedSetChartDimensions);
      this.setChartDimensions();
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.debouncedSetChartDimensions);
    }

    // Once the component is mounted, use the parent container
    // To calculate the charts width, height, and origin.
    setChartDimensions() {
      const $parent = $(this.node).parent();
      const [newWidth, newHeight] = [$parent.width(), $parent.height()];
      if (this.state.width === newWidth && this.state.height === newHeight) return;

      const padding = Style.axisSize;
      const origin = {
        x: padding,
        y: newHeight - padding
      };

      this.setState({
        width: newWidth,
        height: newHeight,
        origin
      });
    }

    render() {
      return (
        <div ref={(node) => { this.node = node; }}>
          <ChartComponent
            {...this.props}
            width={this.state.width}
            height={this.state.height}
            origin={this.state.origin}
          />
        </div>
      );
    }
  };
};

export default ChartHOC;
