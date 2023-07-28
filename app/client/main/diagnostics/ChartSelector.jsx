import $         from 'jquery';
import keycode   from 'keycode';
import PropTypes from 'prop-types';
import React     from 'react';
import ReactDOM  from 'react-dom';

import Style from 'main/diagnostics/Style';
import ChartProjector from 'main/diagnostics/ChartProjector';

// Adds drag-select functionality to the x-axis of a chart
class ChartSelector extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.blur = this.blur.bind(this);
    this.keyup = this.keyup.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);

    this.state = {
      range: {}, // {left, right}
      dragStart: undefined
    };
  }

  componentDidMount() {
    $(window).on('mouseup', this.mouseUp);
    $(window).on('blur', this.blur);
    $(window).on('mousemove', this.mouseMove);
    return $(window).on('keyup', this.keyup);
  }

  componentWillUnmount() {
    $(window).off('mouseup', this.mouseUp);
    $(window).off('blur', this.blur);
    $(window).off('mousemove', this.mousMove);
    $(window).off('keyup', this.keyup);
    return this.enableUserSelect();
  }

  getSelectionPosition(e) {
    const xScale = this.props.projector.getXScale();
    const mouseLeft = e.pageX - $(ReactDOM.findDOMNode(this)).offset().left;
    return {
      left: Math.max(0, Math.min(mouseLeft, this.state.dragStart)),
      right: Math.min(xScale.dy, Math.max(mouseLeft, this.state.dragStart))
    };
  }

  mouseDown(e) {
    this.disableUserSelect();
    const mouseLeft = e.pageX - $(ReactDOM.findDOMNode(this)).offset().left;
    return this.setState({
      dragStart: mouseLeft,
      range: {
        left: mouseLeft,
        right: mouseLeft
      }
    });
  }

  mouseMove(e) {
    if (!this.state.dragStart) {
      return;
    }
    this.setState({
      range: this.getSelectionPosition(e)
    });
  }

  mouseUp(e) {
    if (!this.state.dragStart) {
      return;
    }
    this.enableUserSelect();
    const { left, right } = this.getSelectionPosition(e);

    const callback = () => {
      // Don't select a collapsed range
      if (right === left) {
        return;
      }
      const xScale = this.props.projector.getXScale();
      this.props.onSelectRange([xScale.invert(left), xScale.invert(right)]);
    };

    this.cancelSelection(callback);
  }

  keyup(e) {
    if (keycode(e) === 'esc') {
      this.cancelSelection();
    }
  }

  blur() {
    this.cancelSelection();
  }

  cancelSelection(callback) {
    if (!this.state.dragStart) {
      return;
    }
    this.enableUserSelect();
    this.setState(
      {
        range: {},
        dragStart: undefined
      },
      () => (typeof callback === 'function' ? callback() : undefined)
    );
  }

  disableUserSelect() {
    $('body').addClass('disable-user-select');
  }

  enableUserSelect() {
    $('body').removeClass('disable-user-select');
  }

  render() {
    const xScale = this.props.projector.getXScale();
    const yScale = this.props.projector.getYScale();
    const height = this.props.projector.origin.y;

    return (
      <div
        className="chart-selector"
        onMouseDown={this.mouseDown}
        style={{
          position: 'absolute',
          left: this.props.projector.origin.x,
          height,
          width: xScale.dy
        }}
      >
        <If condition={this.state.dragStart != undefined}>
          <div
            className="selection-area"
            style={{
              position: 'absolute',
              top: Style.chartPadding,
              left: this.state.range.left,
              width: this.state.range.right - this.state.range.left,
              height: yScale.dy
            }}
          />
        </If>
      </div>
    );
  }
}

ChartSelector.propTypes = {
  projector: PropTypes.instanceOf(ChartProjector),
  onSelectRange: PropTypes.func.isRequired
};

export default ChartSelector;
