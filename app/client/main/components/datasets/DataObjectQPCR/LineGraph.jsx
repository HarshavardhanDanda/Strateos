import D3        from 'd3';
import $         from 'jquery';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import './LineGraph.scss';

// QPCR LineGraph
class LineGraph extends React.Component {
  static get propTypes() {
    return {
      height:             PropTypes.number,
      container_type:     PropTypes.object.isRequired,
      postprocessed_data: PropTypes.object.isRequired,
      focusedLines:       PropTypes.array.isRequired,
      well_data:          PropTypes.object.isRequired,
      onFocusLines:       PropTypes.func.isRequired,
      visibleWells:       PropTypes.arrayOf(PropTypes.string)
    };
  }

  static get defaultProps() {
    return {
      height: 400
    };
  }

  constructor() {
    super();

    this.margin = {
      top: 20,
      left: 50,
      right: 70,
      bottom: 35
    };

    this.ctThreshold = 0;

    _.bindAll(
      this,
      'canvasWidth',
      'chartHeight',
      'chartWidth',
      'yScale',
      'xScale',
      'mouseToFluorescence',
      'mouseToCycle',
      'wellIsVisible',
      'paint'
    );
  }

  componentDidMount() {
    this.ctThreshold = this.props.postprocessed_data != undefined
      ? this.props.postprocessed_data.group_threshold
      : undefined;
    this.paint();
  }

  componentDidUpdate() {
    this.paint();
  }

  canvasWidth() {
    const rect = this.lineGraphNode.getBoundingClientRect();
    return rect.width;
  }

  chartHeight() {
    return this.props.height - this.margin.top - this.margin.bottom;
  }

  chartWidth() {
    return this.canvasWidth() - this.margin.left - this.margin.right;
  }

  yScale() {
    const scale = D3.scale.linear().range([this.chartHeight(), 0]);
    const arrayOfWellValues = Object.values(this.props.well_data.data).map((wellDatum) => {
      return Object.values(wellDatum);
    });
    const extent = D3.extent(D3.merge(arrayOfWellValues));
    return scale.domain(extent).nice();
  }

  // Cycle x-axis scale
  xScale() {
    return D3.scale
      .linear()
      .range([0, this.chartWidth()])
      .domain(this.props.well_data.x_domain);
  }

  // Mouse position maped to its Ct
  mouseToFluorescence() {
    const mouse = D3.mouse(this.backgroundNode);
    const yScale = this.yScale();
    const rawFluor = yScale.invert(mouse[1]);
    const [fluorMin, fluorMax] = Array.from(yScale.domain());
    if (rawFluor > fluorMax) {
      return fluorMax;
    } else if (rawFluor < fluorMin) {
      return fluorMin;
    } else {
      return rawFluor;
    }
  }

  // Mouse position mapped to its Cycle
  mouseToCycle() {
    const mouse = D3.mouse(this.backgroundNode);
    return Math.round(this.xScale().invert(mouse[0]));
  }

  wellIsVisible(wellId) {
    const { visibleWells } = this.props;

    if (!visibleWells) {
      return true;
    }

    return _.includes(this.props.visibleWells, `${wellId}`);
  }

  paint() {
    let caption;
    let cts;
    let ctx;
    let lastX;
    let lastY;
    let selected;
    let v;
    let xs;

    $(this.svg).empty();

    const { data }    = this.props.well_data;
    const canvasWidth = this.canvasWidth();
    const width       = this.chartWidth();
    const height      = this.chartHeight();
    const x           = this.xScale();
    const y           = this.yScale();

    // Map D3 event y position to graph Y value
    function canvasToGraph(canvasY) {
      const [dataMin, dataMax] = Array.from(y.domain());
      const scale = (dataMax - dataMin) / height;
      return dataMax - canvasY * scale;
    }

    const xAxis = D3.svg
      .axis()
      .scale(x)
      .orient('bottom');
    const yAxis = D3.svg
      .axis()
      .scale(y)
      .orient('left');

    const isLineInExtent = (extent, line) =>
      _.includes(
        line.map(
          point =>
            point[0] > extent[0][0] && point[0] < extent[1][0] && (point[1] > extent[0][1] && point[1] < extent[1][1])
        ),
        true
      );

    const findIntersectingLines = (extent) => {
      let traces;
      const wells = _.keys(data);

      if (_.isObject(data[wells[0]])) {
        traces = wells.map(well => [well, _.toPairs(data[well])]);
      } else {
        traces = wells.map(well => [well, _.zip(_.range(data[well].length), data[well])]);
      }

      const wellIds = traces.map((t) => {
        if (!this.wellIsVisible(t[0])) {
          return undefined;
        }
        if (isLineInExtent(extent, t[1])) {
          return t[0];
        } else {
          return undefined;
        }
      });

      return _.compact(wellIds);
    };

    const brush = D3.svg
      .brush()
      .x(x)
      .y(y)
      .on('brushend', () => {
        if (brush.empty()) return;

        const lines = findIntersectingLines(brush.extent());
        D3.select('.brush').call(brush.clear());
        if (lines.length > 0) {
          this.props.onFocusLines(lines);
        }
      });

    const svg = D3.select(this.svg)
      .append('g')
      .attr({ transform: `translate(${this.margin.left},${this.margin.top})` });

    svg
      .append('g')
      .attr('class', 'brush')
      .call(brush);

    svg
      .append('g')
      .attr({
        class: 'x axis',
        transform: `translate(0, ${this.props.height - this.margin.top - this.margin.bottom})`
      })
      .call(xAxis);

    svg
      .append('g')
      .attr({ class: 'y axis' })
      .call(yAxis);

    svg
      .append('text')
      .attr({
        class: 'x label',
        'text-anchor': 'middle',
        x: width / 2,
        y: height + 30
      })
      .text(this.props.well_data.x_label);

    svg
      .append('text')
      .attr({
        class: 'y label',
        'text-anchor': 'middle',
        x: -height / 2,
        y: -50,
        dy: '.75em',
        transform: 'rotate(-90)'
      })
      .text(this.props.well_data.y_label);

    var ctLineGroup = svg
      .append('g')
      .attr('id', 'ct-line-group')
      .style('visibility', 'hidden');

    ctLineGroup
      .append('line')
      .attr({
        id: 'ct-line',
        x1: 0,
        y1: height,
        x2: width,
        y2: height
      })
      .style('stroke', 'hsl(0,0%,0%)')
      .style('stroke-width', '0.5')
      .style('cursor', 'move');

    ctLineGroup
      .append('text')
      .attr({
        id: 'ct-label',
        'text-anchor': 'middle',
        x: width + 25,
        y: height + this.margin.top
      })
      .text(canvasToGraph(height).toFixed(2));

    const { backgroundNode, foregroundNode } = this;

    [backgroundNode, foregroundNode].forEach((canvas) => {
      canvas.width        = canvasWidth * devicePixelRatio;
      canvas.height       = this.props.height * devicePixelRatio;
      canvas.style.width  = `${canvasWidth}px`;
      canvas.style.height = `${this.props.height}'px'`;
      canvas.style.top    = `${this.margin.top}px`;
      canvas.style.left   = `${this.margin.left}px`;

      ctx = canvas.getContext('2d');
      ctx.scale(devicePixelRatio, devicePixelRatio);
    });

    const path = (value, context) => {
      context.beginPath();
      const points = _.sortBy(_.toPairs(value), kv => parseFloat(kv[0]));
      for (let i = 0; i < points.length; i++) {
        const [_x, _y] = points[i];
        if (i === 0) {
          context.moveTo(x(_x), y(_y));
        } else {
          context.lineTo(x(_x), y(_y));
        }
      }
      return context.stroke();
    };

    const findLine = () => {
      const cycle = this.mouseToCycle();
      const fluor = this.mouseToFluorescence();
      selected = undefined;
      let min_dist = 20;

      Object.entries(data).forEach((entry) => {
        const key = entry[0];
        const value = entry[1];
        const dist = Math.abs(y(value[cycle]) - y(fluor));
        if (dist < min_dist) {
          min_dist = dist;
          selected = key;
        }
      });
      return selected;
    };

    const drawFocus = (context) => {
      const { focusedLines } = this.props;
      D3.select('.focusedLineName').remove();
      if (!((focusedLines != undefined ? focusedLines.length : undefined) > 0)) {
        return undefined;
      }
      context.strokeStyle = 'steelblue';
      context.fillStyle = 'steelblue';
      context.lineWidth = 3;
      context.lineJoin = 'round';
      return focusedLines.map((line) => {
        path(data[line], context);
        if (focusedLines.length === 1) {
          xs = Object.keys(data[line]);
          lastX = xs[xs.length - 1];
          lastY = data[line][lastX];
          cts = this.props.postprocessed_data != undefined ? this.props.postprocessed_data.cts : undefined;
          caption = this.props.container_type.humanWell(line);
          if ((cts != undefined ? cts[line] : undefined) != undefined) {
            // Some wells never reach the threshold so they will have no reported cts
            caption += ` ${cts[line].toFixed(2)}`;
          }
          return svg
            .append('g')
            .attr({ transform: `translate(${(canvasWidth - this.margin.left - this.margin.right) + 2}, 0)` })
            .append('text')
            .style({ fill: 'steelblue', 'font-weight': 'bold' })
            .attr({ 'alignment-baseline': 'middle', dy: y(lastY), class: 'focusedLineName' })
            .text(caption);
        }
        return undefined;
      });
    };

    D3.select(this.lineGraphNode)
      .on('mouseover', () => {
        return D3.select('#ct-line-group').style('visibility', 'visible');
      })
      .on('mouseout', () => {
        return D3.select('#ct-line-group').style('visibility', 'hidden');
      })
      .on('mousemove', () => {
        var group = D3.select('#ct-line-group');
        var yPos = D3.event.y - this.margin.top;
        // add limiter to make sure the line is not dragged off the graph
        if (Math.sign(yPos) != -1 && yPos <= height) {
          group.attr('transform', 'translate(0,' + (yPos - height) + ')');
          group.select('#ct-label').text(canvasToGraph(yPos).toFixed(2));
        }

        selected = findLine();
        if (!selected) {
          return;
        }

        if (!this.wellIsVisible(selected)) {
          return;
        }

        ctx = foregroundNode.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, this.props.height);
        D3.select('.lineName').remove();
        drawFocus(ctx);
        ({ cts } = this.props.postprocessed_data);
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        path(data[selected], ctx);
        xs = Object.keys(data[selected]);
        lastX = xs[xs.length - 1];
        lastY = data[selected][lastX];
        if (cts != undefined ? Object.hasOwnProperty.call(cts, selected) : undefined) {
          caption = `${this.props.container_type.humanWell(selected)} (${cts[selected].toFixed(2)})`;
        } else {
          caption = `${this.props.container_type.humanWell(selected)}`;
        }
        svg
          .append('g')
          .attr({ transform: `translate(${(canvasWidth - this.margin.left - this.margin.right) + 2}, 0)` })
          .append('text')
          .style({ fill: 'orange', 'font-weight': 'bold' })
          .text(caption)
          .attr({ 'alignment-baseline': 'middle', dy: y(lastY), class: 'lineName' });
      })
      .on('click', () => {
        const l = findLine();
        if (l) {
          this.props.onFocusLines([l]);
        }
      });

    ctx = foregroundNode.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, this.props.height);
    drawFocus(ctx);

    ctx = backgroundNode.getContext('2d');
    ctx.strokeStyle = 'rgba(120,120,120,0.5)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    Object.keys(data).forEach((key) => {
      v = data[key];
      if (!this.wellIsVisible(key)) {
        return;
      }
      path(v, ctx);
    });

    const threshold = this.props.postprocessed_data != undefined
      ? this.props.postprocessed_data.group_threshold
      : undefined;

    if (threshold) {
      // Draw ct line
      const ctStroke = 'hsl(343,85%,50%)';
      ctx.strokeStyle = ctStroke;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      const threshY = Math.round(y(threshold) + 0.5);
      const endX = x(this.props.well_data.x_domain[1]);
      ctx.moveTo(x(0), threshY);
      ctx.lineTo(endX, threshY);
      ctx.stroke();

      // Draw text for ct line
      svg
        .append('text')
        .attr({
          x: endX + 5,
          y: threshY,
          'alignment-baseline': 'middle',
          'font-size': 15
        })
        .text(threshold.toFixed(2));
    }
    return undefined;
  }

  render() {

    return (
      <div
        className="qpcr-linegraph"
        ref={(node) => { this.lineGraphNode = node; }}
      >
        <canvas
          className="qpcr-linegraph__background"
          ref={(node) => { this.backgroundNode = node; }}
          height={this.props.height}
        />
        <canvas
          className="qpcr-linegraph__foreground"
          ref={(node) => { this.foregroundNode = node; }}
          height={this.props.height}
        />
        <svg
          className="qpcr-linegraph__svg"
          ref={(node) => { this.svg = node; }}
          height={this.props.height}
        />
      </div>
    );
  }
}

export default LineGraph;
