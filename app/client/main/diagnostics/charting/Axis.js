import _ from 'lodash';
import { drawText } from './drawing';
import FontFace from './FontFace';

const VERT_OFFSET = 10;

/*
Renders the axis for a chart.
*/
class Axis {
  constructor(props) {
    const defaults = this.getDefaultProps();
    this.props = Object.assign(defaults, props);
    this.state = this.getInitialState();
  }

  render() {
    this.renderLabels();
    this.renderAxisLine();
  }

  getDefaultProps() {
    return {
      origin: {
        x: 0,
        y: 0
      },
      showAxisLine: true,
      thickness: 100,
      textStyle: {
        lineHeight: 20,
        height: 20,
        fontSize: 12
      },
      offset: 0,
      otherAxisLength: 0,
      axisLineStyle: {}, // use current ctx styles
      labelForTick(tick) {
        return tick.toString();
      }
    };
  } // e.g. if you want an epoch displayed as a proper time format

  getInitialState() {
    const textAlign = this.props.axis === 'y' ? this.props.placement === 'left' ? 'right' : 'left' : 'left';

    return {
      textAlign
    };
  }

  renderAxisLine() {
    const { ctx, canvasScale, axisLineStyle } = this.props;
    const [x0, y0] = this.projectDomainValue(this.props.scale.domain[0]);
    const [x1, y1] = this.projectDomainValue(_.last(this.props.scale.domain));

    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = axisLineStyle.strokeStyle;
    ctx.lineWidth = `${axisLineStyle.lineWidth}px`;
    ctx.opacity = axisLineStyle.opacity;

    ctx.moveTo(
      x0 * canvasScale,
      y0 * canvasScale
    );
    ctx.lineTo(x1 * canvasScale, y1 * canvasScale);
    ctx.stroke();

    ctx.restore();
  }

  renderLabels() {
    const [offsetLeft, offsetTop] = Array.from(this.getLabelOffset());
    const baseTextStyle = _.clone(this.props.textStyle);
    if (baseTextStyle.textAlign == undefined) {
      baseTextStyle.textAlign = this.state.textAlign;
    }
    const { canvasScale, ctx } = this.props;

    ctx.save();
    const fontFace = FontFace('sans-serif');
    _.forEach(this.props.scale.ticks(50), (tick) => {
      let [left, top] = Array.from(this.projectDomainValue(tick));

      left += offsetLeft;
      top += offsetTop;

      const labelText = this.props.labelForTick(tick);
      drawText(
        ctx,
        labelText,
        left * canvasScale,
        top * canvasScale,
        200, // arbitrary width
        50, // arbitrary height
        fontFace,
        {
          fontSize: baseTextStyle.fontSize * canvasScale,
          color: baseTextStyle.color
        }
      );
    });
    ctx.restore();
  }

  /*
  Given a value in the domain of the scale, project it to
  pixel values based on the orientation of this axis (x,y) and direction
  (e.g. 'left', 'right',...)
  */
  projectDomainValue(tick) {
    const { axis, direction, origin, scale, otherAxisLength, offset } = this.props;
    const projected = scale.map(tick);

    const left = (() => {
      switch (axis) {
        case 'x':
          switch (direction) {
            case 'right':
              return projected + origin.x;
            case 'left':
              return -projected + origin.x;
          }
          break;

        case 'y':
          return origin.x + otherAxisLength * offset;
      }
    })();

    const top = (() => {
      switch (axis) {
        case 'y':
          switch (direction) {
            case 'down':
              return projected + origin.y; // drawing in positive direction
            case 'up':
              return -projected + origin.y;
          }
          break;
        case 'x':
          return origin.y - otherAxisLength * offset;
      }
    })();

    return [left, top];
  }

  getLabelOffset() {
    const { axis, placement, thickness } = this.props;
    const left = (() => {
      switch (axis) {
        case 'x':
          return 0;
        case 'y':
          switch (placement) {
            case 'left':
              return -thickness;
            case 'right':
              return 15;
            default:
              console.warning('No placement given.');
          }
          break;
        default:
          console.warn('No axis given.');
      }
    })();

    const top = (() => {
      switch (axis) {
        case 'y':
          return 0;
        case 'x':
          switch (placement) {
            case 'above':
              return 2 * -VERT_OFFSET;
            case 'below':
              return VERT_OFFSET;
            default:
          }
          break;
        default:
      }
    })();

    return [left, top];
  }

  axisNameFontStyle() {
    return {
      lineHeight: 30,
      height: 30,
      fontSize: 13
    };
  }
}

export default Axis;
